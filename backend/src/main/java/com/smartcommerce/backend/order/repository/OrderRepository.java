package com.smartcommerce.backend.order.repository;

import com.smartcommerce.backend.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // You can add custom queries if needed
}
