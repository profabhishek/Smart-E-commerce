package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.order.dto.OrderMapper;
import com.smartcommerce.backend.order.dto.OrderRequest;
import com.smartcommerce.backend.order.dto.OrderResponse;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.order.repository.PaymentRepository;
import com.smartcommerce.backend.order.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final OrderMapper orderMapper;
    private final PaymentRepository paymentRepo;

    public OrderController(OrderService orderService,
                           UserRepository userRepo,
                           OrderRepository orderRepo,
                           OrderMapper orderMapper,
                           PaymentRepository paymentRepo) {
        this.orderService = orderService;
        this.userRepo = userRepo;
        this.orderRepo = orderRepo;
        this.orderMapper = orderMapper;
        this.paymentRepo = paymentRepo;
    }

    private User currentUser(Authentication auth) {
        String email = auth.getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    // ✅ Get full order by ID (ownership enforced; 403 vs 404)
    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        Order order = orderService.getOrderForUserStrict(id, me.getId());

        // fetch payment (may not exist yet)
        Payment payment = paymentRepo.findByOrder_Id(order.getId()).orElse(null);

        return orderMapper.toDto(order, payment);
    }


    // ✅ Get only status (lighter response; ownership enforced)
    @GetMapping("/{id}/status")
    public String getOrderStatus(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        return orderService.getOrderForUserStrict(id, me.getId()).getStatus().name();
    }

    // ✅ (Optional) Download invoice — ownership enforced exactly the same way
    @GetMapping("/{id}/invoice")
    public ResponseEntity<Resource> downloadInvoice(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        Order order = orderService.getOrderForUserStrict(id, me.getId());
        // TODO: generate and return the PDF Resource for "order"
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Invoice generation not implemented");
    }

    // ✅ Create order (force logged-in user)
    @PostMapping("/create")
    public Order createOrder(@RequestBody OrderRequest req, Authentication auth) {
        User me = currentUser(auth);
        return orderService.createDraftOrder(
                me,
                req.getCustomerName(),
                req.getPhone(),
                req.getShippingAddress(),
                req.getItems(),
                req.getSubtotal(),
                req.getShippingFee(),
                req.getCodFee(),
                req.getDiscount()
        );
    }

    // ✅ Get orders for a user (block access to others)
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersForUser(@PathVariable Long userId, Authentication auth) {
        User me = currentUser(auth);
        if (!me.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access another user's orders");
        }
        return orderService.getOrdersByUserId(userId);
    }

    // ✅ Get my orders (no params, safest)
    @GetMapping("/my")
    public List<Order> getMyOrders(Authentication auth) {
        User me = currentUser(auth);
        return orderRepo.findByUser_Id(me.getId());
    }

    // ✅ Finalize order (ownership enforced)
    @PostMapping("/{id}/finalize")
    public Order finalizeOrder(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        return orderService.finalizeOrder(id, me.getId());
    }

    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, Authentication auth) {
        try {
            Order order = orderService.cancelOrder(id, auth.getName());
            return ResponseEntity.ok(Map.of(
                    "orderId", order.getId(),
                    "status", order.getStatus().name(),   // ✅ actual status
                    "message", "Order cancelled successfully"
            ));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Not allowed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
