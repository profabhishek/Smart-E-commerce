package com.smartcommerce.backend.order.repository;

import com.smartcommerce.backend.order.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // 🔎 Look up by Razorpay Order ID (used in confirm flow)
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    // 🔎 Look up by Razorpay Payment ID (direct fetch or webhook)
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    // 🔎 Check if Razorpay order already exists (idempotency)
    boolean existsByRazorpayOrderId(String razorpayOrderId);

    // 🔎 Find by Refund ID (for webhook: refund.processed/failed)
    Optional<Payment> findByRefundId(String refundId);

    // 🔎 Find by linked order (used in OrderService.cancelOrder)
    Optional<Payment> findByOrder_Id(Long orderId);
}
