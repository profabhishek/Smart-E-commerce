package com.smartcommerce.backend.order.dto;

import com.smartcommerce.backend.auth.dto.AddressDTO;
import lombok.Data;

@Data
public class CreateDraftRequest {
    private String customerName;   // Full Name (from checkout form)
    private String phone;          // Phone number
    private AddressDTO address;    // ✅ Nested object (houseNo, area, landmark, etc.)
    private String paymentMethod;  // "upi" | "card" | "netbanking" | "cod"
    private String couponCode;     // Coupon code (optional)
}
