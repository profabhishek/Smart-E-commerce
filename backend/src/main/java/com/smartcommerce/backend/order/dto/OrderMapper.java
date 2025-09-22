package com.smartcommerce.backend.order.dto;

import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.Payment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderResponse toDto(Order order, Payment payment) {
        if (order == null) return null;

        // map items
        List<OrderItemDTO> items = order.getItems() != null
                ? order.getItems().stream()
                .map(this::mapItem)
                .collect(Collectors.toList())
                : List.of();

        // map payment (can be null)
        PaymentDTO paymentDto = payment != null ? mapPayment(payment) : null;

        return new OrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getTotalPayable(),
                order.getCustomerName(),
                order.getPhone(),
                order.getShippingAddress() != null
                        ? new ShippingAddressDTO(order.getShippingAddress())
                        : null,
                items,
                paymentDto
        );
    }

    private OrderItemDTO mapItem(OrderItem item) {
        return new OrderItemDTO(
                item.getId(),
                item.getProductName(),
                item.getQuantity(),
                item.getPrice(),
                item.getProductPhoto()
        );
    }

    private PaymentDTO mapPayment(Payment payment) {
        return new PaymentDTO(
                payment.getMethod().name(),          // Gateway: RAZORPAY / COD
                payment.getPaymentMethod(),          // upi / card / netbanking
                payment.getStatus().name(),          // CAPTURED / REFUNDED / FAILED
                payment.getRazorpayPaymentId() != null
                        ? payment.getRazorpayPaymentId()
                        : payment.getReferenceId(),  // txnId fallback
                payment.getAmount(),
                payment.getCurrency()
        );
    }
}
