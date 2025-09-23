package com.smartcommerce.backend.order.dto;

import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public class AdminOrderDTO {
    public Long id;
    public Long userId;
    public String customerName;
    public String phone;

    public ShippingAddressDTO shippingAddress;

    public Long subtotal;
    public Long shippingFee;
    public Long codFee;
    public Long discount;
    public Long totalPayable;

    public String status;
    public String razorpayOrderId;

    public Instant createdAt;
    public Instant updatedAt;

    public List<OrderItemDTO> items;

    // ---- Mapper ----
    public static AdminOrderDTO from(Order o) {
        AdminOrderDTO dto = new AdminOrderDTO();
        dto.id = o.getId();
        dto.userId = o.getUser().getId();
        dto.customerName = o.getCustomerName();
        dto.phone = o.getPhone();

        dto.shippingAddress = ShippingAddressDTO.from(o.getShippingAddress());

        dto.subtotal = o.getSubtotal();
        dto.shippingFee = o.getShippingFee();
        dto.codFee = o.getCodFee();
        dto.discount = o.getDiscount();
        dto.totalPayable = o.getTotalPayable();

        dto.status = o.getStatus().name();
        dto.razorpayOrderId = o.getRazorpayOrderId();

        dto.createdAt = o.getCreatedAt();
        dto.updatedAt = o.getUpdatedAt();

        dto.items = o.getItems().stream()
                .map(OrderItemDTO::from)
                .collect(Collectors.toList());

        return dto;
    }

    // ---- Nested DTOs ----
    public static class ShippingAddressDTO {
        public String houseNo;
        public String area;
        public String landmark;
        public String city;
        public String state;
        public String country;
        public String pinCode;
        public String type;

        public static ShippingAddressDTO from(ShippingAddress sa) {
            if (sa == null) return null;
            ShippingAddressDTO dto = new ShippingAddressDTO();
            dto.houseNo = sa.getHouseNo();
            dto.area = sa.getArea();
            dto.landmark = sa.getLandmark();
            dto.city = sa.getCity();
            dto.state = sa.getState();
            dto.country = sa.getCountry();
            dto.pinCode = sa.getPinCode();
            dto.type = sa.getType();
            return dto;
        }
    }

    public static class OrderItemDTO {
        public Long productId;
        public String productName;
        public Long price;
        public Integer quantity;

        public static OrderItemDTO from(OrderItem oi) {
            OrderItemDTO dto = new OrderItemDTO();
            dto.productId = oi.getProductId();
            dto.productName = oi.getProductName();
            dto.price = oi.getPrice();
            dto.quantity = oi.getQuantity();
            return dto;
        }
    }
}
