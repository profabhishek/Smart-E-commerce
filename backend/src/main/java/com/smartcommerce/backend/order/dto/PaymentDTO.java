package com.smartcommerce.backend.order.dto;

public class PaymentDTO {
    private String gateway;   // RAZORPAY / COD
    private String method;    // upi / card / wallet
    private String status;    // CAPTURED / REFUNDED / FAILED
    private String txnId;     // razorpayPaymentId or COD ref
    private long amount;      // paise
    private String currency;  // INR

    public PaymentDTO(String gateway, String method, String status, String txnId, long amount, String currency) {
        this.gateway = gateway;
        this.method = method;
        this.status = status;
        this.txnId = txnId;
        this.amount = amount;
        this.currency = currency;
    }

    // getters
    public String getGateway() { return gateway; }
    public String getMethod() { return method; }
    public String getStatus() { return status; }
    public String getTxnId() { return txnId; }
    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
