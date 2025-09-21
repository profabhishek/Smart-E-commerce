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
    @Transactional
    public RazorOrderResponse createRazorpayOrder(Order order) throws Exception {
        if (order.getTotalPayable() == null || order.getTotalPayable() <= 0) {
            throw new IllegalStateException("Invalid payable amount");
        }

        // Idempotent: if already created, return existing details
        if (order.getRazorpayOrderId() != null) {
            return new RazorOrderResponse(
                    props.getKeyId(),
                    order.getRazorpayOrderId(),
                    order.getTotalPayable(),
                    "INR"
            );
        }

        RazorpayClient client = razorpay();

        // Amount in paise
        JSONObject req = new JSONObject(Map.of(
                "amount", order.getTotalPayable(),
                "currency", "INR",
                "receipt", "rcpt_" + order.getId(),
                "payment_capture", 1
        ));

        com.razorpay.Order rzpOrder = client.orders.create(req);
        String rzpOrderId = rzpOrder.get("id");

        // Persist order
        order.setRazorpayOrderId(rzpOrderId);
        order.setStatus(Order.OrderStatus.PAYMENT_PENDING);
        order.setUpdatedAt(Instant.now());
        orderRepo.save(order);

        // Seed payment row
        Payment p = new Payment();
        p.setOrder(order);
        p.setMethod(Payment.Gateway.RAZORPAY);
        p.setRazorpayOrderId(rzpOrderId);
        p.setAmount(order.getTotalPayable());
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

        // Verify signature
        String payload = rzpOrderId + "|" + rzpPaymentId;
        String expected = hmacSha256(payload, props.getKeySecret());
        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                rzpSignature.getBytes(StandardCharsets.UTF_8))) {
            throw new SecurityException("Invalid Razorpay signature");
        }

        Payment payment = paymentRepo.findByRazorpayOrderId(rzpOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order " + orderId));

        // Idempotency
        if (payment.getStatus() == PaymentStatus.CAPTURED) return;

        try {
            RazorpayClient client = razorpay();
            com.razorpay.Payment rzpPayment = client.payments.fetch(rzpPaymentId);

            // Core fields
            String method = rzpPayment.get("method");   // upi, card, netbanking, wallet
            String status = rzpPayment.get("status");   // created, authorized, captured, failed

            payment.setPaymentMethod(method);
            payment.setRazorpayPaymentId(rzpPaymentId);
            payment.setRazorpaySignature(rzpSignature);

            // Detailed tracking
            JSONObject paymentJson = rzpPayment.toJson();

            if ("upi".equalsIgnoreCase(method)) {
                JSONObject upiObj = paymentJson.optJSONObject("upi");
                if (upiObj != null) payment.setUpiId(upiObj.optString("vpa", null));
                JSONObject acquirer = paymentJson.optJSONObject("acquirer_data");
                if (acquirer != null) payment.setReferenceId(acquirer.optString("upi_transaction_id", null));
            } else if ("card".equalsIgnoreCase(method)) {
                JSONObject cardObj = paymentJson.optJSONObject("card");
                if (cardObj != null) {
                    payment.setCardLast4(cardObj.optString("last4", null));
                    payment.setCardNetwork(cardObj.optString("network", null));
                }
            } else if ("netbanking".equalsIgnoreCase(method)) {
                payment.setBankName(paymentJson.optString("bank", null));
                JSONObject acquirer = paymentJson.optJSONObject("acquirer_data");
                if (acquirer != null) payment.setReferenceId(acquirer.optString("bank_transaction_id", null));
            }

            // Status mapping
            if ("captured".equalsIgnoreCase(status)) {
                payment.setStatus(PaymentStatus.CAPTURED);
                order.setStatus(Order.OrderStatus.PAID);
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
        // Only for CAPTURED online payments
        if (payment.getStatus() != PaymentStatus.CAPTURED || payment.getRazorpayPaymentId() == null) {
            return;
        }
        try {
            RazorpayClient client = razorpay();

            JSONObject req = new JSONObject();
            req.put("amount", order.getTotalPayable()); // paise
            req.put("speed", "optimum");                // or "instant" (fee applies)

            Refund refund = client.payments.refund(payment.getRazorpayPaymentId(), req);

            payment.setRefundId(refund.get("id"));
            payment.setRefundStatus("REQUESTED");
            payment.setRefundAmount(order.getTotalPayable());
            // You may leave payment.status as CAPTURED until processed,
            // or set to REFUNDED immediately if your policy prefers.
            paymentRepo.save(payment);

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

            // Optionally update order status notes or timeline here
            // (Not changing Order status; it's already CANCELLED in cancel flow)
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
