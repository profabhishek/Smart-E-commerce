package com.smartcommerce.backend.order.repository;

import com.smartcommerce.backend.order.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // Example: find payment by Razorpay orderId
    Payment findByRazorpayOrderId(String razorpayOrderId);
}
