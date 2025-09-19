package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final CartItemRepository cartRepo;

    public OrderService(OrderRepository orderRepo, UserRepository userRepo, CartItemRepository cartRepo) {
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
        this.cartRepo = cartRepo;
    }

    // ✅ Create draft order
    public Order createDraftOrder(
            Long userId,
            String customerName,
            String phone,
            ShippingAddress address,
            List<OrderItem> items,
            long subtotal,
            long shippingFee,
            long codFee,
            long discount
    ) {
        // 1) Load user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2) Create order
        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(customerName);
        order.setPhone(phone);
        order.setShippingAddress(address);
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setCodFee(codFee);
        order.setDiscount(discount);
        order.setTotalPayable(subtotal + shippingFee + codFee - discount);
        order.setStatus(Order.OrderStatus.DRAFT);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());

        // 3) Link items
        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setItems(items);

        // 4) Save
        return orderRepo.save(order);
    }

    // ✅ Fetch by ID
    public Order getOrderById(Long id) {
        return orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // ✅ Update order status
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        order.setUpdatedAt(Instant.now());
        return orderRepo.save(order);
    }

    // ✅ Finalize order and delete cart
    @Transactional
    public Order finalizeOrder(Long id) {
        Order order = getOrderById(id);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setUpdatedAt(Instant.now());

        Order saved = orderRepo.save(order);

        // 🧹 cleanup cart after purchase
        cartRepo.deleteByUser_Id(order.getUser().getId());

        return saved;
    }
}
