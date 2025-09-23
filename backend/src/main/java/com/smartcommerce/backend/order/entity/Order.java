package com.smartcommerce.backend.order.entity;

import com.smartcommerce.backend.auth.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "orders")
public class Order {

    public enum OrderStatus {
        DRAFT, PAYMENT_PENDING, PAID, CONFIRMED,
        PACKED, SHIPPED, DELIVERED, CANCELLED, FAILED, REFUND_PENDING, REFUNDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String customerName;
    private String phone;

    @Embedded
    private ShippingAddress shippingAddress;

    // amounts in paise (minor units)
    private Long subtotal;
    private Long shippingFee;
    private Long codFee;
    private Long discount;
    private Long totalPayable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OrderStatus status;

    private String razorpayOrderId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    /**
     * Important:
     *  - cascade = ALL + orphanRemoval = true => replacing list or deleting order cleans children
     *  - LAZY to avoid huge eager graphs on lists
     */
    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<OrderItem> items = new ArrayList<>();

    // --- Getters / Setters ---
    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public ShippingAddress getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(ShippingAddress shippingAddress) { this.shippingAddress = shippingAddress; }

    public Long getSubtotal() { return subtotal; }
    public void setSubtotal(Long subtotal) { this.subtotal = subtotal; }

    public Long getShippingFee() { return shippingFee; }
    public void setShippingFee(Long shippingFee) { this.shippingFee = shippingFee; }

    public Long getCodFee() { return codFee; }
    public void setCodFee(Long codFee) { this.codFee = codFee; }

    public Long getDiscount() { return discount; }
    public void setDiscount(Long discount) { this.discount = discount; }

    public Long getTotalPayable() { return totalPayable; }
    public void setTotalPayable(Long totalPayable) { this.totalPayable = totalPayable; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    // --- Lifecycle ---
    @PrePersist
    protected void onCreate() {
        final Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = OrderStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // --- Domain helpers (make controller/service code simpler & safer) ---
    public void addItem(OrderItem item) {
        if (item == null) return;
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        if (item == null) return;
        items.remove(item);
        item.setOrder(null);
    }

    /** Replace list in a way that triggers orphanRemoval correctly. */
    public void replaceItems(List<OrderItem> newItems) {
        // Remove items that are not in new list
        Iterator<OrderItem> it = items.iterator();
        while (it.hasNext()) {
            OrderItem existing = it.next();
            if (newItems == null || newItems.stream().noneMatch(n -> equalsByBusinessKey(n, existing))) {
                it.remove();                 // triggers orphanRemoval
                existing.setOrder(null);
            }
        }
        // Add or update items
        if (newItems != null) {
            for (OrderItem n : newItems) {
                n.setOrder(this);
                // just add; duplicates by business key can be handled by UI or validation if needed
                if (!items.contains(n)) {
                    items.add(n);
                }
            }
        }
    }

    // Business-key equality for replaceItems (productId + productName + price + qty + photo)
    private boolean equalsByBusinessKey(OrderItem a, OrderItem b) {
        return Objects.equals(a.getProductId(), b.getProductId())
                && Objects.equals(a.getProductName(), b.getProductName())
                && Objects.equals(a.getPrice(), b.getPrice())
                && Objects.equals(a.getQuantity(), b.getQuantity())
                && Objects.equals(a.getProductPhoto(), b.getProductPhoto());
    }

    public boolean isDeliveredOrBeyond() {
        return status == OrderStatus.DELIVERED;
    }
}
