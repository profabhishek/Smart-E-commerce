package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.entity.Payment.PaymentStatus;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.order.repository.PaymentRepository;
import com.smartcommerce.backend.order.service.CheckoutService;
import com.smartcommerce.backend.order.service.PaymentService;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/razorpay")
public class RazorpayWebhookController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final CheckoutService checkoutService;

    public RazorpayWebhookController(PaymentService paymentService,
                                     PaymentRepository paymentRepo,
                                     OrderRepository orderRepo,
                                     CheckoutService checkoutService) {
        this.paymentService = paymentService;
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.checkoutService = checkoutService;
    }

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody String body
    ) {
        // 🔎 Case-insensitive search for signature
        String signature = headers.entrySet().stream()
                .filter(e -> e.getKey().equalsIgnoreCase("X-Razorpay-Signature"))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);

        if (signature == null || !paymentService.verifyWebhook(body, signature)) {
            return ResponseEntity.status(401).build();
        }

        JSONObject evt = new JSONObject(body);
        String event = evt.optString("event", "");
        JSONObject payload = evt.optJSONObject("payload");
        if (payload == null) return ResponseEntity.ok().build();

        switch (event) {
            case "payment.captured" -> handlePaymentCaptured(payload, signature);
            case "payment.failed"   -> handlePaymentFailed(payload, signature);
            case "refund.processed" -> handleRefundProcessed(payload);
            case "refund.failed"    -> handleRefundFailed(payload);
            default -> { /* ignore other events */ }
        }

        return ResponseEntity.ok().build();
    }

    // ---------------- Handlers ----------------

    private void handlePaymentCaptured(JSONObject payload, String signature) {
        JSONObject paymentWrapper = payload.optJSONObject("payment");
        if (paymentWrapper == null) return;

        JSONObject paymentEntity = paymentWrapper.optJSONObject("entity");
        if (paymentEntity == null) return;

        String rzpOrderId   = paymentEntity.optString("order_id", null);
        String rzpPaymentId = paymentEntity.optString("id", null);
        String channel      = paymentEntity.optString("method", null); // upi/card/netbanking/wallet...

        if (rzpOrderId == null || rzpPaymentId == null) return;

        Optional<Payment> opt = paymentRepo.findByRazorpayOrderId(rzpOrderId);
        if (opt.isEmpty()) return;

        Payment p = opt.get();
        if (p.getStatus() == PaymentStatus.CAPTURED) {
            // Idempotent: already captured
            return;
        }

        p.setRazorpayPaymentId(rzpPaymentId);
        p.setStatus(PaymentStatus.CAPTURED);
        p.setMethod(Payment.Gateway.RAZORPAY); // enum field
        p.setPaymentMethod(channel);            // string: upi/card/etc
        p.setRazorpaySignature(signature);      // persist webhook signature
        p.setUpdatedAt(Instant.now());
        paymentRepo.save(p);

        // Mark order paid using your checkout flow
        Order o = p.getOrder();
        checkoutService.markPaid(o);
    }

    private void handlePaymentFailed(JSONObject payload, String signature) {
        JSONObject paymentWrapper = payload.optJSONObject("payment");
        if (paymentWrapper == null) return;

        JSONObject paymentEntity = paymentWrapper.optJSONObject("entity");
        if (paymentEntity == null) return;

        String rzpOrderId   = paymentEntity.optString("order_id", null);
        String rzpPaymentId = paymentEntity.optString("id", null);
        String channel      = paymentEntity.optString("method", null);

        if (rzpOrderId == null || rzpPaymentId == null) return;

        Optional<Payment> opt = paymentRepo.findByRazorpayOrderId(rzpOrderId);
        if (opt.isEmpty()) return;

        Payment p = opt.get();
        if (p.getStatus() == PaymentStatus.FAILED) {
            // Idempotent: already failed
            return;
        }

        p.setRazorpayPaymentId(rzpPaymentId);
        p.setStatus(PaymentStatus.FAILED);
        p.setMethod(Payment.Gateway.RAZORPAY);
        p.setPaymentMethod(channel);
        p.setRazorpaySignature(signature);
        p.setUpdatedAt(Instant.now());
        paymentRepo.save(p);

        // Update order → FAILED and persist
        Order o = p.getOrder();
        o.setStatus(Order.OrderStatus.FAILED);
        o.setUpdatedAt(Instant.now());
        orderRepo.save(o);
        // Or use: checkoutService.markFailed(o);
    }

    private void handleRefundProcessed(JSONObject payload) {
        JSONObject refundWrapper = payload.optJSONObject("refund");
        if (refundWrapper == null) return;

        JSONObject refundEntity = refundWrapper.optJSONObject("entity");
        if (refundEntity == null) return;

        String refundId = refundEntity.optString("id", null);
        if (refundId == null) return;

        // Moves refundStatus → PROCESSED and sets Payment.status → REFUNDED
        paymentService.markRefundProcessed(refundId);
    }

    private void handleRefundFailed(JSONObject payload) {
        JSONObject refundWrapper = payload.optJSONObject("refund");
        if (refundWrapper == null) return;

        JSONObject refundEntity = refundWrapper.optJSONObject("entity");
        if (refundEntity == null) return;

        String refundId = refundEntity.optString("id", null);
        if (refundId == null) return;

        // Moves refundStatus → FAILED (keeps Payment.status as CAPTURED)
        paymentService.markRefundFailed(refundId);
    }
}
