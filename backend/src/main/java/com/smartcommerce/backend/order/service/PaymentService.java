package com.smartcommerce.backend.order.service;

import com.razorpay.RazorpayClient;
import com.razorpay.Refund;
import com.smartcommerce.backend.config.RazorpayProps;
import com.smartcommerce.backend.order.dto.RazorOrderResponse;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.entity.Payment.PaymentStatus;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.order.repository.PaymentRepository;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
public class PaymentService {

    private final RazorpayProps props;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;

    public PaymentService(RazorpayProps props, PaymentRepository paymentRepo, OrderRepository orderRepo) {
        this.props = props;
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
    }

    // ---------------- Helpers ----------------
    private RazorpayClient razorpay() throws Exception {
        return new RazorpayClient(props.getKeyId(), props.getKeySecret());
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ---------------- CREATE RAZORPAY ORDER ----------------
    // ---------------- CREATE RAZORPAY ORDER ----------------
    @Transactional
    public RazorOrderResponse createRazorpayOrder(Order order) throws Exception {
        if (order.getTotalPayable() == null || order.getTotalPayable() <= 0) {
            throw new IllegalStateException("Invalid payable amount");
        }

        if (order.getRazorpayOrderId() != null) {
            return new RazorOrderResponse(
                    props.getKeyId(),
                    order.getRazorpayOrderId(),
                    order.getTotalPayable(), // already paise
                    "INR"
            );
        }

        RazorpayClient client = razorpay();

        // ✅ order.getTotalPayable() is already paise
        JSONObject req = new JSONObject(Map.of(
                "amount", order.getTotalPayable(),
                "currency", "INR",
                "receipt", "rcpt_" + order.getId(),
                "payment_capture", 1
        ));

        com.razorpay.Order rzpOrder = client.orders.create(req);
        String rzpOrderId = rzpOrder.get("id");

        order.setRazorpayOrderId(rzpOrderId);
        order.setStatus(Order.OrderStatus.PAYMENT_PENDING);
        order.setUpdatedAt(Instant.now());
        orderRepo.save(order);

        Payment p = new Payment();
        p.setOrder(order);
        p.setMethod(Payment.Gateway.RAZORPAY);
        p.setRazorpayOrderId(rzpOrderId);
        p.setAmount(order.getTotalPayable()); // ✅ store paise
        p.setCurrency("INR");
        p.setStatus(PaymentStatus.CREATED);
        paymentRepo.save(p);

        return new RazorOrderResponse(props.getKeyId(), rzpOrderId, order.getTotalPayable(), "INR");
    }

    // ---------------- CONFIRM RAZORPAY PAYMENT ----------------
    @Transactional
    public void confirmPayment(Long orderId, String rzpOrderId, String rzpPaymentId, String rzpSignature) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String payload = rzpOrderId + "|" + rzpPaymentId;
        String expected = hmacSha256(payload, props.getKeySecret());

        // Razorpay signature is lower-case hex; compare case-insensitively for safety
        if (rzpSignature == null || !expected.equalsIgnoreCase(rzpSignature)) {
            throw new SecurityException("Invalid Razorpay signature");
        }

        Payment payment = paymentRepo.findByRazorpayOrderId(rzpOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order " + orderId));

        // Idempotency
        if (payment.getStatus() == PaymentStatus.CAPTURED) return;

        try {
            RazorpayClient client = razorpay();
            com.razorpay.Payment rzpPayment = client.payments.fetch(rzpPaymentId);

            String method = rzpPayment.get("method");
            String status = rzpPayment.get("status"); // created, authorized, captured, failed

            payment.setPaymentMethod(method);
            payment.setRazorpayPaymentId(rzpPaymentId);
            payment.setRazorpaySignature(rzpSignature);

            JSONObject json = rzpPayment.toJson();

            if ("upi".equalsIgnoreCase(method)) {
                JSONObject upiObj = json.optJSONObject("upi");
                if (upiObj != null) payment.setUpiId(upiObj.optString("vpa", null));
                JSONObject acq = json.optJSONObject("acquirer_data");
                if (acq != null) payment.setReferenceId(acq.optString("upi_transaction_id", null));
            } else if ("card".equalsIgnoreCase(method)) {
                JSONObject card = json.optJSONObject("card");
                if (card != null) {
                    payment.setCardLast4(card.optString("last4", null));
                    payment.setCardNetwork(card.optString("network", null));
                }
            } else if ("netbanking".equalsIgnoreCase(method)) {
                payment.setBankName(json.optString("bank", null));
                JSONObject acq = json.optJSONObject("acquirer_data");
                if (acq != null) payment.setReferenceId(acq.optString("bank_transaction_id", null));
            }

            if ("captured".equalsIgnoreCase(status)) {
                long capturedAmountPaise = ((Number) rzpPayment.get("amount")).longValue(); // ✅ safe cast
                payment.setAmount(capturedAmountPaise); // ✅ store actual paise captured
                payment.setStatus(PaymentStatus.CAPTURED);

                // Do NOT set PAID here; let markPaid() do stock + status
                if (order.getStatus() == Order.OrderStatus.DRAFT) {
                    order.setStatus(Order.OrderStatus.PAYMENT_PENDING);
                }

            } else if ("failed".equalsIgnoreCase(status)) {
                payment.setStatus(PaymentStatus.FAILED);
                order.setStatus(Order.OrderStatus.FAILED);

            } else {
                payment.setStatus(PaymentStatus.ATTEMPTED);
                order.setStatus(Order.OrderStatus.PAYMENT_PENDING);
            }

            paymentRepo.save(payment);
            orderRepo.save(order);

        } catch (Exception e) {
            System.err.println("Payment confirmation failed for orderId=" + orderId +
                    " paymentId=" + rzpPaymentId + " error=" + e.getMessage());
            throw new RuntimeException("Failed to fetch/confirm Razorpay payment", e);
        }
    }

    // ---------------- INITIATE REFUND (called from OrderService.cancelOrder) ----------------
    @Transactional
    public void initiateRefund(Order order, Payment payment) {
        if (payment.getStatus() != PaymentStatus.CAPTURED
                || payment.getRazorpayPaymentId() == null) return;

        try {
            RazorpayClient client = razorpay();

            JSONObject req = new JSONObject();
            req.put("amount", payment.getAmount());
            req.put("speed", "optimum");

            Refund refund = client.payments.refund(payment.getRazorpayPaymentId(), req);

            // Save refund attempt
            payment.setRefundId(refund.get("id"));
            payment.setRefundStatus("PENDING");  // <-- force pending here
            payment.setRefundAmount(payment.getAmount());
            paymentRepo.save(payment);

            order.setStatus(Order.OrderStatus.REFUND_PENDING); // always pending until webhook
            orderRepo.save(order);

        } catch (Exception e) {
            throw new RuntimeException("Refund initiation failed: " + e.getMessage(), e);
        }
    }

    // ---------------- WEBHOOK HELPERS ----------------
    @Transactional
    public void markRefundProcessed(String refundId) {
        paymentRepo.findByRefundId(refundId).ifPresent(p -> {
            p.setRefundStatus("PROCESSED");
            p.setStatus(PaymentStatus.REFUNDED);
            paymentRepo.save(p);

            Order o = p.getOrder();
            o.setStatus(Order.OrderStatus.REFUNDED);
            orderRepo.save(o);
        });
    }

    @Transactional
    public void markRefundFailed(String refundId) {
        paymentRepo.findByRefundId(refundId).ifPresent(p -> {
            p.setRefundStatus("FAILED");
            // keep status as CAPTURED to indicate money still with us
            paymentRepo.save(p);
        });
    }

    // ---------------- VERIFY WEBHOOK ----------------
    public boolean verifyWebhook(String body, String headerSig) {
        String actual = hmacSha256(body, props.getWebhookSecret());
        return MessageDigest.isEqual(
                actual.getBytes(StandardCharsets.UTF_8),
                headerSig.getBytes(StandardCharsets.UTF_8));
    }
}
