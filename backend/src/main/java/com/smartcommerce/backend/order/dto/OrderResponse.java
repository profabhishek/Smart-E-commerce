package com.smartcommerce.backend.order.dto;

import java.util.List;

public class OrderResponse {
    private Long id;
    private String status;
    private Long totalPayable;
    private String customerName;
    private String phone;

    private ShippingAddressDTO shippingAddress;
    private List<OrderItemDTO> items;
    private PaymentDTO payment;

    // --- Constructors ---
    public OrderResponse() {
    }

    public OrderResponse(Long id, String status, Long totalPayable,
                         String customerName, String phone,
                         ShippingAddressDTO shippingAddress,
                         List<OrderItemDTO> items, PaymentDTO payment) {
        this.id = id;
        this.status = status;
        this.totalPayable = totalPayable;
        this.customerName = customerName;
        this.phone = phone;
        this.shippingAddress = shippingAddress;
        this.items = items;
        this.payment = payment;
    }

    // --- Getters ---
    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public Long getTotalPayable() {
        return totalPayable;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getPhone() {
        return phone;
    }

    public ShippingAddressDTO getShippingAddress() {
        return shippingAddress;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public PaymentDTO getPayment() {
        return payment;
    }

    // --- Setters ---
    public void setId(Long id) {
        this.id = id;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTotalPayable(Long totalPayable) {
        this.totalPayable = totalPayable;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setShippingAddress(ShippingAddressDTO shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }

    public void setPayment(PaymentDTO payment) {
        this.payment = payment;
    }

    // --- Builder style for convenience (optional) ---
    public static class Builder {
        private Long id;
        private String status;
        private Long totalPayable;
        private String customerName;
        private String phone;
        private ShippingAddressDTO shippingAddress;
        private List<OrderItemDTO> items;
        private PaymentDTO payment;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder totalPayable(Long totalPayable) {
            this.totalPayable = totalPayable;
            return this;
        }

        public Builder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder shippingAddress(ShippingAddressDTO shippingAddress) {
            this.shippingAddress = shippingAddress;
            return this;
        }

        public Builder items(List<OrderItemDTO> items) {
            this.items = items;
            return this;
        }

        public Builder payment(PaymentDTO payment) {
            this.payment = payment;
            return this;
        }

        public OrderResponse build() {
            return new OrderResponse(id, status, totalPayable, customerName, phone, shippingAddress, items, payment);
        }
    }
}
