package com.smartcommerce.backend.cart.dto;

import com.smartcommerce.backend.cart.entity.CartItem;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal productPrice;      // original price
    private int quantity;
    private BigDecimal totalPrice;        // total with original price
    private String productPhoto;
    private Integer discount;             // discount % (calculated from price & discountPrice)
    private BigDecimal discountedPrice;   // price after discount
    private BigDecimal discountedTotal;   // total after discount

    // ✅ Constructor: map from entity
    public CartItemDTO(CartItem item) {
        this.id = item.getId();
        this.productId = item.getProduct().getId();
        this.productName = item.getProduct().getName();
        this.productPrice = item.getProduct().getPrice();
        this.quantity = item.getQuantity();
        this.totalPrice = productPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);

        this.productPhoto = (item.getProduct().getPhotos() != null && !item.getProduct().getPhotos().isEmpty())
                ? item.getProduct().getPhotos().get(0).getPhoto_url()
                : null;

        BigDecimal discountPrice = item.getProduct().getDiscountPrice();

        if (discountPrice != null && discountPrice.compareTo(BigDecimal.ZERO) > 0
                && discountPrice.compareTo(productPrice) < 0) {

            this.discountedPrice = discountPrice.setScale(2, RoundingMode.HALF_UP);
            this.discountedTotal = discountedPrice.multiply(BigDecimal.valueOf(quantity))
                    .setScale(2, RoundingMode.HALF_UP);

            // derive % discount = (price - discountPrice) / price * 100
            BigDecimal diff = productPrice.subtract(discountPrice);
            this.discount = productPrice.compareTo(BigDecimal.ZERO) > 0
                    ? diff.multiply(BigDecimal.valueOf(100))
                    .divide(productPrice, 0, RoundingMode.HALF_UP)
                    .intValue()
                    : 0;
        } else {
            // no discount → discounted = original
            this.discountedPrice = productPrice.setScale(2, RoundingMode.HALF_UP);
            this.discountedTotal = totalPrice;
            this.discount = 0;
        }
    }

    // ✅ Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public BigDecimal getProductPrice() { return productPrice; }
    public void setProductPrice(BigDecimal productPrice) { this.productPrice = productPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getProductPhoto() { return productPhoto; }
    public void setProductPhoto(String productPhoto) { this.productPhoto = productPhoto; }

    public Integer getDiscount() { return discount; }
    public void setDiscount(Integer discount) { this.discount = discount; }

    public BigDecimal getDiscountedPrice() { return discountedPrice; }
    public void setDiscountedPrice(BigDecimal discountedPrice) { this.discountedPrice = discountedPrice; }

    public BigDecimal getDiscountedTotal() { return discountedTotal; }
    public void setDiscountedTotal(BigDecimal discountedTotal) { this.discountedTotal = discountedTotal; }
}
