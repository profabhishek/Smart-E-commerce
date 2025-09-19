package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.order.dto.ConfirmPaymentRequest;
import com.smartcommerce.backend.order.dto.CreateDraftRequest;
import com.smartcommerce.backend.order.dto.RazorOrderResponse;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.service.CheckoutService;
import com.smartcommerce.backend.order.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkout;
    private final PaymentService payment;

    public CheckoutController(CheckoutService checkout, PaymentService payment) {
        this.checkout = checkout; this.payment = payment;
    }

    @PostMapping("/create-draft")
    public ResponseEntity<Order> createDraft(@RequestBody CreateDraftRequest req) {
        Order o = checkout.createDraftFromRequest(req);
        return ResponseEntity.ok(o);
    }

    @PostMapping("/create-razorpay-order/{orderId}")
    public ResponseEntity<RazorOrderResponse> createRazorpayOrder(@PathVariable Long orderId) throws Exception {
        Order o = checkout.getOrderById(orderId);
        RazorOrderResponse res = payment.createRazorpayOrder(o);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<Void> confirmPayment(@RequestBody ConfirmPaymentRequest req) {
        payment.confirmPayment(req.orderId, req.razorpayOrderId, req.razorpayPaymentId, req.razorpaySignature);
        Order o = checkout.getOrderById(req.orderId);
        checkout.markPaid(o);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/place-cod")
    public ResponseEntity<Order> placeCod(@RequestParam Long orderId) {
        Order o = checkout.getOrderById(orderId);
        o = checkout.confirmCOD(o);
        return ResponseEntity.ok(o);
    }
}
