package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepo;

    public OrderService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    // Create draft order
    public Order createDraftOrder(
            String userId,
            String customerName,
            String phone,
            ShippingAddress address,
            List<OrderItem> items,
            long subtotal,
            long shippingFee,
            long codFee,
            long discount
    ) {
        Order order = new Order();
        order.setUserId(userId);
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

        // link items to order
        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setItems(items);

        return orderRepo.save(order); // saves both order and items
    }

    // Fetch order by ID
    public Order getOrderById(Long id) {
        return orderRepo.findById(id).orElseThrow(() ->
                new RuntimeException("Order not found"));
    }

    // Update status
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        order.setUpdatedAt(Instant.now());
        return orderRepo.save(order);
    }
}
