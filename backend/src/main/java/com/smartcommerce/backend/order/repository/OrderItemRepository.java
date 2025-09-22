package com.smartcommerce.backend.order.repository;

import com.smartcommerce.backend.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Add custom queries later if needed
}
