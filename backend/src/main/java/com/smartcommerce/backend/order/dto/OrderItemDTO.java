package com.smartcommerce.backend.order.dto;

public class OrderItemDTO {
    private Long id;
    private String productName;
    private Integer quantity;
    private Long price;        // in paise
    private String productPhoto;

    public OrderItemDTO(Long id, String productName, Integer quantity, Long price, String productPhoto) {
        this.id = id;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
        this.productPhoto = productPhoto;
    }

    public Long getId() { return id; }
    public String getProductName() { return productName; }
    public Integer getQuantity() { return quantity; }
    public Long getPrice() { return price; }
    public String getProductPhoto() { return productPhoto; }
}
