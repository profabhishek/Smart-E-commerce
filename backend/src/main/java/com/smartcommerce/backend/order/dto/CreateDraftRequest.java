package com.smartcommerce.backend.order.dto;

public class CreateDraftRequest {
    public Long userId; // fallback if no auth
    public AddressDTO address;
    public String paymentMethod; // "upi" | "card" | "netbanking" | "cod"
    public GstDTO gst; // nullable
    public String couponCode; // nullable
}
