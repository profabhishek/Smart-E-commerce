package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.order.dto.AdminOrderDTO;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderRepository orderRepo;

    public AdminOrderController(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    // ✅ Paginated + filterable list
    @GetMapping
    public ResponseEntity<Page<AdminOrderDTO>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            Pageable pageable // Spring will map ?page=0&size=20&sort=createdAt,DESC automatically
    ) {
        Order.OrderStatus enumStatus = null;
        if (status != null) {
            try {
                enumStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + status);
            }
        }

        Page<Order> page = orderRepo.filterOrders(enumStatus, start, end, userId, pageable);
        Page<AdminOrderDTO> dtoPage = page.map(AdminOrderDTO::from);

        return ResponseEntity.ok(dtoPage);
    }

    // ✅ Single order
    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderDTO> getOrder(@PathVariable Long id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(AdminOrderDTO.from(order));
    }

    // ✅ Update status
    @PutMapping("/{id}/status")
    public ResponseEntity<AdminOrderDTO> updateStatus(@PathVariable Long id,
                                                      @RequestParam String status) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        try {
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            order.setStatus(newStatus);
            orderRepo.save(order);
            return ResponseEntity.ok(AdminOrderDTO.from(order));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }
}
