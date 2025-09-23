package com.smartcommerce.backend.order.controller;

import com.smartcommerce.backend.order.dto.AdminOrderDTO;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderRepository orderRepo;

    public AdminOrderController(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    // ---------- READ: Paginated + filterable list ----------
    @GetMapping
    public ResponseEntity<Page<AdminOrderDTO>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderId,   // 👈 added
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            Pageable pageable
    ) {
        Order.OrderStatus enumStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                enumStatus = Order.OrderStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
            }
        }

        Page<Order> page = orderRepo.filterOrders(enumStatus, start, end, userId, orderId, pageable);
        return ResponseEntity.ok(page.map(AdminOrderDTO::from));
    }

    // ---------- READ: Single order ----------
    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderDTO> getOrder(@PathVariable Long id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return ResponseEntity.ok(AdminOrderDTO.from(order));
    }

    // ---------- UPDATE: Status only ----------
    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<AdminOrderDTO> updateStatus(@PathVariable Long id,
                                                      @RequestParam String status) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        final Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }

        order.setStatus(newStatus);
        // @PreUpdate on entity will set updatedAt
        return ResponseEntity.ok(AdminOrderDTO.from(order));
    }

    // ---------- UPDATE: Full order (fields + address + items + optional status) ----------
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<AdminOrderDTO> updateOrder(@PathVariable Long id,
                                                     @RequestBody AdminOrderDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty body");
        }

        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Core fields (do NOT allow changing owner from here)
        if (dto.customerName != null) order.setCustomerName(dto.customerName);
        if (dto.phone != null) order.setPhone(dto.phone);
        if (dto.userId != null && order.getUser() != null && !dto.userId.equals(order.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Changing order owner is not supported");
        }
        if (dto.razorpayOrderId != null) order.setRazorpayOrderId(dto.razorpayOrderId);

        // Financials (paise)
        if (dto.subtotal != null) order.setSubtotal(dto.subtotal);
        if (dto.shippingFee != null) order.setShippingFee(dto.shippingFee);
        if (dto.codFee != null) order.setCodFee(dto.codFee);
        if (dto.discount != null) order.setDiscount(dto.discount);
        if (dto.totalPayable != null) order.setTotalPayable(dto.totalPayable);

        // Status (optional in body)
        if (dto.status != null) {
            try {
                order.setStatus(Order.OrderStatus.valueOf(dto.status.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status in body: " + dto.status);
            }
        }

        // Address
        if (dto.shippingAddress != null) {
            ShippingAddress sa = order.getShippingAddress();
            if (sa == null) {
                sa = new ShippingAddress();
                order.setShippingAddress(sa);
            }
            if (dto.shippingAddress.houseNo != null) sa.setHouseNo(dto.shippingAddress.houseNo);
            if (dto.shippingAddress.area != null) sa.setArea(dto.shippingAddress.area);
            if (dto.shippingAddress.landmark != null) sa.setLandmark(dto.shippingAddress.landmark);
            if (dto.shippingAddress.city != null) sa.setCity(dto.shippingAddress.city);
            if (dto.shippingAddress.state != null) sa.setState(dto.shippingAddress.state);
            if (dto.shippingAddress.country != null) sa.setCountry(dto.shippingAddress.country);
            if (dto.shippingAddress.pinCode != null) sa.setPinCode(dto.shippingAddress.pinCode);
            if (dto.shippingAddress.type != null) sa.setType(dto.shippingAddress.type);
        }

        // Items (replace all)
        if (dto.items != null) {
            List<OrderItem> newItems = new ArrayList<>();
            for (AdminOrderDTO.OrderItemDTO it : dto.items) {
                if (it == null) continue;
                OrderItem oi = new OrderItem();
                oi.setOrder(order); // back-reference is required
                oi.setProductId(it.productId);
                oi.setProductName(it.productName);
                oi.setPrice(it.price);
                oi.setQuantity(it.quantity != null ? it.quantity : 1);
                newItems.add(oi);
            }
            order.getItems().clear();        // orphanRemoval=true will delete old rows
            order.getItems().addAll(newItems);
        }

        // JPA dirty checking will flush on @Transactional commit
        return ResponseEntity.ok(AdminOrderDTO.from(order));
    }

    // ---------- DELETE: Soft delete by default; hard delete with ?hard=true ----------
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id,
                                            @RequestParam(name = "hard", defaultValue = "false") boolean hard) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!hard) {
            // Soft delete = mark as CANCELLED (keep history)
            order.setStatus(Order.OrderStatus.CANCELLED);
            return ResponseEntity.noContent().build();
        }

        // Hard delete (children removed via cascade+orphanRemoval)
        try {
            orderRepo.delete(order);
            return ResponseEntity.noContent().build();
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Hard delete failed. Ensure items mapping is cascade=ALL & orphanRemoval=true. Cause: " + ex.getMessage()
            );
        }
    }
}
