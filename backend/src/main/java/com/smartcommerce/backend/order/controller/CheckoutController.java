package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.order.dto.ConfirmPaymentRequest;
import com.smartcommerce.backend.order.dto.CreateDraftRequest;
import com.smartcommerce.backend.order.dto.RazorOrderResponse;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.service.CheckoutService;
import com.smartcommerce.backend.order.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkout;
    private final PaymentService payment;
    private final UserRepository userRepo;

    public CheckoutController(CheckoutService checkout, PaymentService payment, UserRepository userRepo) {
        this.checkout = checkout; this.payment = payment; this.userRepo = userRepo;
    }

    @PostMapping("/create-draft")
    public Order createDraft(@RequestBody CreateDraftRequest req, Authentication auth) {
        String email = auth.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ debug log (optional)
        System.out.println("Creating draft order for user=" + user.getEmail());
        System.out.println("CustomerName=" + req.getCustomerName() + ", Phone=" + req.getPhone());
        if (req.getAddress() != null) {
            System.out.println("Address => " + req.getAddress().getHouseNo() + ", "
                    + req.getAddress().getArea() + ", " + req.getAddress().getCity());
        }

        return checkout.createDraftFromRequest(user, req);
    }

    @PostMapping("/create-razorpay-order/{orderId}")
    public ResponseEntity<RazorOrderResponse> createRazorpayOrder(@PathVariable Long orderId) throws Exception {
        Order o = checkout.getOrderById(orderId);
        RazorOrderResponse res = payment.createRazorpayOrder(o);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<?> confirmPayment(@RequestBody ConfirmPaymentRequest req) {
        try {
            System.out.println("🔔 Confirm-payment request received:");
            System.out.println("orderId=" + req.orderId);
            System.out.println("razorpayOrderId=" + req.razorpayOrderId);
            System.out.println("razorpayPaymentId=" + req.razorpayPaymentId);
            System.out.println("razorpaySignature=" + req.razorpaySignature);

            // 1. Confirm payment in PaymentService
            payment.confirmPayment(req.orderId, req.razorpayOrderId, req.razorpayPaymentId, req.razorpaySignature);

            // 2. Fetch updated order
            Order order = checkout.getOrderById(req.orderId);

            // 3. Mark paid (optional, if confirmPayment already updates)
            checkout.markPaid(order);

            return ResponseEntity.ok().body(Map.of(
                    "message", "Payment confirmed",
                    "orderStatus", order.getStatus().name()
            ));
        } catch (Exception e) {
            e.printStackTrace(); // log full error in console
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Payment confirmation failed",
                    "reason", e.getMessage()
            ));
        }
    }


    @PostMapping("/place-cod")
    public ResponseEntity<Order> placeCod(@RequestParam Long orderId) {
        Order o = checkout.getOrderById(orderId);
        o = checkout.confirmCOD(o);
        return ResponseEntity.ok(o);
    }
}
