package com.smartcommerce.backend.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public class CartSummaryDTO {
    private List<CartItemDTO> items;
    private int totalItems;
    private BigDecimal totalAmount;          // after discounts
    private BigDecimal originalTotalAmount;  // before discounts
    private BigDecimal totalSavings;         // original - discounted

    public CartSummaryDTO(List<CartItemDTO> items) {
        this.items = items;
        this.totalItems = items.stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();

        // before discount
        this.originalTotalAmount = items.stream()
                .map(CartItemDTO::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // after discount
        this.totalAmount = items.stream()
                .map(CartItemDTO::getDiscountedTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // savings
        this.totalSavings = originalTotalAmount.subtract(totalAmount);
    }

    // ✅ Getters
    public List<CartItemDTO> getItems() { return items; }
    public int getTotalItems() { return totalItems; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getOriginalTotalAmount() { return originalTotalAmount; }
    public BigDecimal getTotalSavings() { return totalSavings; }
}
