package com.smartcommerce.backend.order.dto;

public class RazorOrderResponse {
    private String key;           // must match frontend expectation
    private String orderId;       // simpler name for razorpayOrderId
    private long amount;
    private String currency;

    public RazorOrderResponse(String key, String orderId, long amount, String currency) {
        this.key = key;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
    }

    // ✅ Jackson will now serialize these
    public String getKey() { return key; }
    public String getOrderId() { return orderId; }
    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
