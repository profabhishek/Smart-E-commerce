package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.order.entity.OrderItem;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CouponService {
    public long computeDiscountPaise(String couponCode, String userId, List<OrderItem> items, long subtotalPaise) {
        if (couponCode == null || couponCode.isBlank()) return 0L;

        // Example: FLAT50 for >= ₹999 cart
        if ("FLAT50".equalsIgnoreCase(couponCode) && subtotalPaise >= 99900) {
            return 5000L; // ₹50
        }

        // TODO: replace with DB-backed coupons, per-user usage, product/category exclusions, date validity, etc.
        return 0L;
    }
}
