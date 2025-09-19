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
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Void> handle(@RequestHeader("X-Razorpay-Signature") String signature,
                                       @RequestBody String body) {
        if (!paymentService.verifyWebhook(body, signature)) {
            return ResponseEntity.status(401).build();
        }

        JSONObject evt = new JSONObject(body);
        String event = evt.optString("event", "");
        JSONObject payload = evt.optJSONObject("payload") != null ? evt.getJSONObject("payload") : new JSONObject();

        if ("payment.captured".equals(event)) {
            JSONObject paymentObj = payload.getJSONObject("payment").getJSONObject("entity");
            String rzpOrderId = paymentObj.optString("order_id", null);
            String rzpPaymentId = paymentObj.optString("id", null);

            if (rzpOrderId != null) {
                Payment p = paymentRepo.findByRazorpayOrderId(rzpOrderId);
                if (p != null && p.getStatus() != PaymentStatus.CAPTURED) {
                    p.setRazorpayPaymentId(rzpPaymentId);
                    p.setStatus(PaymentStatus.CAPTURED);
                    paymentRepo.save(p);

                    Order o = p.getOrder();
                    checkoutService.markPaid(o);
                }
            }
        }
        // you can handle payment.failed / refund.* etc similarly

        return ResponseEntity.ok().build();
    }
}
