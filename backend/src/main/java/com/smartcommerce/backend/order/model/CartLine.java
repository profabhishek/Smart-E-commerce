package com.smartcommerce.backend.order.model;

public class CartLine {
    private Long productId;
    private int qty;

    public CartLine() {}
    public CartLine(Long productId, int qty) { this.productId = productId; this.qty = qty; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }
}
