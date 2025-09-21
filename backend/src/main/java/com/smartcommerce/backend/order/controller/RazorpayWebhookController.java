package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.entity.Payment.PaymentStatus;
import com.smartcommerce.backend.order.repository.PaymentRepository;
import com.smartcommerce.backend.order.service.CheckoutService;
import com.smartcommerce.backend.order.service.PaymentService;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/razorpay")
public class RazorpayWebhookController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepo;
    private final CheckoutService checkoutService;

    public RazorpayWebhookController(PaymentService paymentService,
                                     PaymentRepository paymentRepo,
                                     CheckoutService checkoutService) {
        this.paymentService = paymentService;
        this.paymentRepo = paymentRepo;
        this.checkoutService = checkoutService;
    }

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader("X-Razorpay-Signature") String signature,
            @RequestBody String body
    ) {
        // 1. Verify webhook signature
        if (!paymentService.verifyWebhook(body, signature)) {
            return ResponseEntity.status(401).build();
        }

        // 2. Parse event JSON
        JSONObject evt = new JSONObject(body);
        String event = evt.optString("event", "");
        JSONObject payload = evt.optJSONObject("payload") != null ? evt.getJSONObject("payload") : new JSONObject();

        // 3. Handle payment captured
        if ("payment.captured".equals(event)) {
            JSONObject paymentObj = payload.getJSONObject("payment").getJSONObject("entity");
            String rzpOrderId = paymentObj.optString("order_id", null);
            String rzpPaymentId = paymentObj.optString("id", null);

            if (rzpOrderId != null) {
                paymentRepo.findByRazorpayOrderId(rzpOrderId).ifPresent(p -> {
                    if (p.getStatus() != PaymentStatus.CAPTURED) {
                        p.setRazorpayPaymentId(rzpPaymentId);
                        p.setStatus(PaymentStatus.CAPTURED);
                        p.setUpdatedAt(Instant.now());
                        paymentRepo.save(p);

                        // Mark order as paid and finalize
                        Order o = p.getOrder();
                        checkoutService.markPaid(o);
                    }
                });
            }
        }

        // 4. Handle payment failed
        if ("payment.failed".equals(event)) {
            JSONObject paymentObj = payload.getJSONObject("payment").getJSONObject("entity");
            String rzpOrderId = paymentObj.optString("order_id", null);
            String rzpPaymentId = paymentObj.optString("id", null);

            if (rzpOrderId != null) {
                paymentRepo.findByRazorpayOrderId(rzpOrderId).ifPresent(p -> {
                    if (p.getStatus() != PaymentStatus.FAILED) {
                        p.setRazorpayPaymentId(rzpPaymentId);
                        p.setStatus(PaymentStatus.FAILED);
                        p.setUpdatedAt(Instant.now());
                        paymentRepo.save(p);

                        // Update order status
                        Order o = p.getOrder();
                        o.setStatus(Order.OrderStatus.FAILED);
                    }
                });
            }
        }

        return ResponseEntity.ok().build();
    }
}
