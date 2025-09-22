package com.smartcommerce.backend.order.dto;

public class ConfirmPaymentRequest {
    public Long orderId;
    public String razorpayOrderId;
    public String razorpayPaymentId;
    public String razorpaySignature;
}
