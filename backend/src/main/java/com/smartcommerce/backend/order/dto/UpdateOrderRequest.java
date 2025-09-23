package com.smartcommerce.backend.order.dto;

import java.util.List;

public class UpdateOrderRequest {
    public String customerName;
    public String phone;
    public ShippingAddressDTO shippingAddress;

    public Long subtotal;
    public Long shippingFee;
    public Long codFee;
    public Long discount;
    public Long totalPayable;

    public String status; // optional
    public String razorpayOrderId;

    public List<OrderItemDTO> items;

    public static class ShippingAddressDTO {
        public String houseNo;
        public String area;
        public String landmark;
        public String city;
        public String state;
        public String country;
        public String pinCode;
        public String type;
    }

    public static class OrderItemDTO {
        public Long productId;
        public String productName;
        public Long price;
        public Integer quantity;
    }
}
