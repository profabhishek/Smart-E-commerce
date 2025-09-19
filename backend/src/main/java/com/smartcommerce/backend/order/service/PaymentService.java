package com.smartcommerce.backend.order.service;

import com.razorpay.RazorpayClient;
import com.smartcommerce.backend.config.RazorpayProps;
import com.smartcommerce.backend.order.dto.RazorOrderResponse;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.entity.Payment.PaymentMethod;
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

    @Transactional
    public RazorOrderResponse createRazorpayOrder(Order order) throws Exception {
        if (order.getTotalPayable() == null || order.getTotalPayable() <= 0) {
            throw new IllegalStateException("Invalid payable amount");
        }

        // If order already has a Razorpay ID, return it (idempotency)
        if (order.getRazorpayOrderId() != null) {
            return new RazorOrderResponse(
                    props.getKeyId(),
                    order.getRazorpayOrderId(),
                    order.getTotalPayable(),
                    "INR"
            );
        }

        // Create Razorpay order
        RazorpayClient client = new RazorpayClient(props.getKeyId(), props.getKeySecret());
        JSONObject req = new JSONObject(Map.of(
                "amount", order.getTotalPayable(),
                "currency", "INR",
                "receipt", "rcpt_" + order.getId(),
                "payment_capture", 1
        ));

        com.razorpay.Order rzpOrder = client.orders.create(req);
        String rzpOrderId = rzpOrder.get("id");

        // Save in DB
        order.setRazorpayOrderId(rzpOrderId);
        order.setStatus(Order.OrderStatus.PAYMENT_PENDING);
        order.setUpdatedAt(Instant.now());
        orderRepo.save(order);

        Payment p = new Payment();
        p.setOrder(order);
        p.setMethod(PaymentMethod.RAZORPAY);
        p.setStatus(PaymentStatus.CREATED);
        p.setRazorpayOrderId(rzpOrderId);
        p.setAmount(order.getTotalPayable());
        p.setCurrency("INR");
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        paymentRepo.save(p);

        return new RazorOrderResponse(props.getKeyId(), rzpOrderId, order.getTotalPayable(), "INR");
    }

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

        // Find payment
        Payment payment = paymentRepo.findByRazorpayOrderId(rzpOrderId);
        if (payment == null) throw new RuntimeException("Payment not found for order");

        // Idempotency
        if (payment.getStatus() == PaymentStatus.CAPTURED) return;

        // Update payment
        payment.setRazorpayPaymentId(rzpPaymentId);
        payment.setRazorpaySignature(rzpSignature);
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setUpdatedAt(Instant.now());
        paymentRepo.save(payment);

        // ✅ Update order
        order.setStatus(Order.OrderStatus.PAID);
        order.setUpdatedAt(Instant.now());
        orderRepo.save(order);
    }

    public boolean verifyWebhook(String body, String headerSig) {
        String actual = hmacSha256(body, props.getWebhookSecret());
        return MessageDigest.isEqual(
                actual.getBytes(StandardCharsets.UTF_8),
                headerSig.getBytes(StandardCharsets.UTF_8));
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
}
