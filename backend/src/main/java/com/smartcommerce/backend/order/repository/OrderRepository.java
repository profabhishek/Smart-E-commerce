package com.smartcommerce.backend.order.repository;

import com.smartcommerce.backend.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 🔍 Filter by status
    List<Order> findByStatus(Order.OrderStatus status);

    // 🔍 Filter by userId (go through User entity)
    List<Order> findByUser_Id(Long userId);

    // 🔍 Filter by date range
    List<Order> findByCreatedAtBetween(Instant start, Instant end);

    // 🔍 Combine filters (with pagination)
    @Query("select o from Order o " +
            "where (:status is null or o.status = :status) " +
            "and (:start is null or o.createdAt >= :start) " +
            "and (:end is null or o.createdAt <= :end) " +
            "and (:userId is null or o.user.id = :userId)")
    Page<Order> filterOrders(@Param("status") Order.OrderStatus status,
                             @Param("start") Instant start,
                             @Param("end") Instant end,
                             @Param("userId") Long userId,
                             Pageable pageable);
}
