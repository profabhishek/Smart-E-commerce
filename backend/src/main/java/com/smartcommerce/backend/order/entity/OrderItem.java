package com.smartcommerce.backend.order.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    private Long productId;

    @Column(length = 512)
    private String productName;

    // amounts in paise
    private Long price;

    private Integer quantity;

    @Column(name = "product_photo", length = 1024)
    private String productPhoto;

    // --- Getters / Setters ---
    public Long getId() { return id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getProductPhoto() { return productPhoto; }
    public void setProductPhoto(String productPhoto) { this.productPhoto = productPhoto; }

    // Optional but useful for replace semantics in memory (not for DB identity)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderItem that)) return false;
        // Only compare business fields (exclude id/order)
        return Objects.equals(productId, that.productId)
                && Objects.equals(productName, that.productName)
                && Objects.equals(price, that.price)
                && Objects.equals(quantity, that.quantity)
                && Objects.equals(productPhoto, that.productPhoto);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, productName, price, quantity, productPhoto);
    }
}
