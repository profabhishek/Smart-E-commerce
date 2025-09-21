package com.smartcommerce.backend.order.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "payments",
        indexes = {
                @Index(name = "idx_order_id", columnList = "order_id"),
                @Index(name = "idx_rzp_order", columnList = "razorpayOrderId"),
                @Index(name = "idx_rzp_payment", columnList = "razorpayPaymentId"),
                @Index(name = "idx_refund_id", columnList = "refundId")
        }
)
public class Payment {

    // --- Enums ---
    public enum PaymentStatus {
        CREATED, ATTEMPTED, CAPTURED, REFUNDED, FAILED
    }

    public enum Gateway {
        RAZORPAY, COD
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to order
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Gateway method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    // Razorpay IDs
    @Column(length = 255, unique = true)
    private String razorpayOrderId;

    @Column(length = 255, unique = true)
    private String razorpayPaymentId;

    @JsonIgnore
    @Column(length = 255)
    private String razorpaySignature;

    // Amount & currency
    @Column(nullable = false)
    private Long amount;      // in paise

    @Column(nullable = false, length = 10)
    private String currency;  // INR

    // --- Tracking fields ---
    @Column(length = 50)
    private String paymentMethod;  // upi / card / netbanking / wallet

    @Column(length = 100)
    private String referenceId;    // UPI Ref / Bank Ref

    @Column(length = 10)
    private String cardLast4;

    @Column(length = 50)
    private String cardNetwork;

    @Column(length = 100)
    private String upiId;

    @Column(length = 100)
    private String bankName;

    // Refund tracking
    @Column(length = 100, unique = true)
    private String refundId;   // Razorpay refund ID

    @Column(length = 20)
    private String refundStatus;  // REQUESTED, PROCESSED, FAILED

    @Column
    private Long refundAmount;    // in paise

    // Timestamps
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    // Optimistic locking (prevents double updates/refunds)
    @Version
    private Long version;

    // --- Lifecycle hooks ---
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) this.status = PaymentStatus.CREATED;
        if (this.currency == null) this.currency = "INR";
        if (this.method == null) this.method = Gateway.RAZORPAY;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Gateway getMethod() { return method; }
    public void setMethod(Gateway method) { this.method = method; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }

    public String getCardNetwork() { return cardNetwork; }
    public void setCardNetwork(String cardNetwork) { this.cardNetwork = cardNetwork; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getRefundId() { return refundId; }
    public void setRefundId(String refundId) { this.refundId = refundId; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public Long getRefundAmount() { return refundAmount; }
    public void setRefundAmount(Long refundAmount) { this.refundAmount = refundAmount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
