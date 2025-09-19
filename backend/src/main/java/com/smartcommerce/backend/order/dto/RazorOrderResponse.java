package com.smartcommerce.backend.order.dto;

public class RazorOrderResponse {
    public String keyId;
    public String razorpayOrderId;
    public long amount;     // paise
    public String currency; // INR

    public RazorOrderResponse(String keyId, String razorpayOrderId, long amount, String currency) {
        this.keyId = keyId; this.razorpayOrderId = razorpayOrderId; this.amount = amount; this.currency = currency;
    }
}
