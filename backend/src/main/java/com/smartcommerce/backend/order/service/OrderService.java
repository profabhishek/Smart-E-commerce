package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.Payment;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.order.repository.PaymentRepository;
import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.ProductPhoto;
import com.smartcommerce.backend.product.repository.ProductPhotoRepository;
import com.smartcommerce.backend.product.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static com.smartcommerce.backend.order.entity.Payment.PaymentStatus.REFUNDED;

@Service
public class OrderService {

    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final CartItemRepository cartRepo;
    private final ProductRepository productRepo;
    private final ProductPhotoRepository productPhotoRepo;
    private final PaymentRepository paymentRepo;
    private final PaymentService paymentService;


    public OrderService(OrderRepository orderRepo,
                        UserRepository userRepo,
                        CartItemRepository cartRepo,
                        ProductRepository productRepo,
                        ProductPhotoRepository productPhotoRepo,
                        PaymentRepository paymentRepo,
                        PaymentService paymentService
                        ) {
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
        this.cartRepo = cartRepo;
        this.productRepo = productRepo;
        this.productPhotoRepo = productPhotoRepo;
        this.paymentService = paymentService;
        this.paymentRepo = paymentRepo;
    }

    // ✅ Rupees → Paise
    private long rupeesToPaise(BigDecimal rupees) {
        if (rupees == null) return 0L;
        return rupees.movePointRight(2).longValueExact(); // 339.00 → 33900
    }

    // ✅ Create draft order with product snapshot
    public Order createDraftOrder(
            User user,  // 🔥 pass full User, not userId
            String customerName,
            String phone,
            ShippingAddress address,
            List<OrderItem> items,
            long subtotal,
            long shippingFee,
            long codFee,
            long discount
    ) {
        // 📝 Create new Order
        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(customerName);
        order.setPhone(phone);
        order.setShippingAddress(address);
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setCodFee(codFee);
        order.setDiscount(discount);
        order.setTotalPayable(subtotal + shippingFee + codFee - discount);
        order.setStatus(Order.OrderStatus.DRAFT);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());

        // 📦 Enrich items with product snapshot
        List<OrderItem> enrichedItems = new ArrayList<>();
        for (OrderItem item : items) {
            Product product = productRepo.findById(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + item.getProductId()));

            List<ProductPhoto> photos = productPhotoRepo.findByProduct_Id(product.getId());
            String photoUrl = photos.isEmpty()
                    ? "https://via.placeholder.com/150"
                    : photos.get(0).getPhotoUrl();

            // snapshot
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setProductPhoto(photoUrl);
            orderItem.setPrice(rupeesToPaise(product.getPrice()));
            orderItem.setQuantity(item.getQuantity());

            enrichedItems.add(orderItem);
        }

        order.setItems(enrichedItems);
        return orderRepo.save(order);
    }

    // ❗ Unscoped fetch (avoid exposing this in controllers)
    public Order getOrderById(Long id) {
        return orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    // ✅ Scoped fetch: explicit 403 vs 404
    public Order getOrderForUserStrict(Long orderId, Long userId) {
        // Check existence first → 404 if missing
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Then ownership → 403 if not owner
        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access another user's order");
        }
        return order;
    }

    // ✅ Lightweight ownership check using direct query (returns 404 for not-exist or not-yours)
    public Order getOrderForUserOr404(Long orderId, Long userId) {
        return orderRepo.findByIdAndUser_Id(orderId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    // ✅ Update order status (admin/ops can call separately; for user actions use strict variant)
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        order.setUpdatedAt(Instant.now());
        return orderRepo.save(order);
    }

    // ✅ Finalize order (ownership enforced)
    @Transactional
    public Order finalizeOrder(Long id, Long userId) {
        Order order = getOrderForUserStrict(id, userId);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setUpdatedAt(Instant.now());

        Order saved = orderRepo.save(order);

        // 🧹 Clear cart for this user
        cartRepo.deleteByUser_Id(order.getUser().getId());

        return saved;
    }

    @Transactional
    public Order cancelOrder(Long orderId, String userEmail) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("Not your order");
        }

        if (order.getStatus() == Order.OrderStatus.CANCELLED
                || order.getStatus() == Order.OrderStatus.REFUNDED) {
            return order;
        }
        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Order cannot be cancelled after delivery");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(Instant.now());
        orderRepo.save(order);

        paymentRepo.findByOrder_Id(orderId).ifPresent(payment -> {
            boolean isCaptured = payment.getStatus() == Payment.PaymentStatus.CAPTURED;
            boolean hasPaymentId = payment.getRazorpayPaymentId() != null && !payment.getRazorpayPaymentId().isBlank();

            if (isCaptured && hasPaymentId) {
                order.setStatus(Order.OrderStatus.REFUND_PENDING);
                orderRepo.save(order);
                paymentService.initiateRefund(order, payment);
            }
        });

        return order;  // 🔥 return latest state
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepo.findByUser_Id(user.getId());
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepo.findByUser_Id(userId);
    }
}
