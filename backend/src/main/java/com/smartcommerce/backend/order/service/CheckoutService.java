package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.order.dto.AddressDTO;
import com.smartcommerce.backend.order.dto.CreateDraftRequest;
import com.smartcommerce.backend.order.dto.GstDTO;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.model.CartLine;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutService {

    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final CartPort cartPort;
    private final CouponService couponService;
    private final CartItemRepository cartItemRepo;
    private final UserRepository userRepo;

    public CheckoutService(OrderRepository orderRepo,
                           ProductRepository productRepo,
                           CartPort cartPort,
                           CouponService couponService,
                           CartItemRepository cartItemRepo,
                           UserRepository userRepo) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.cartPort = cartPort;
        this.couponService = couponService;
        this.cartItemRepo = cartItemRepo;
        this.userRepo = userRepo;
    }

    public Order getOrderById(Long id) {
        return orderRepo.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    /** Create draft by recomputing everything from DB (authoritative). */
    @Transactional
    public Order createDraftFromRequest(CreateDraftRequest req) {
        if (req.userId == null) {
            throw new IllegalArgumentException("User must be logged in");
        }

        // 1) Load the User entity
        User user = userRepo.findById(req.userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2) Load cart lines
        List<CartLine> cart = cartPort.loadUserCart(req.userId.toString()); // cartPort takes String
        if (cart == null || cart.isEmpty()) throw new IllegalArgumentException("Cart is empty");

        // 3) Snapshot items
        long subtotal = 0L;
        List<OrderItem> items = new ArrayList<>();

        for (CartLine line : cart) {
            Product p = productRepo.findById(line.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + line.getProductId()));

            if (line.getQty() <= 0) throw new IllegalArgumentException("Invalid quantity for product " + p.getId());
            if (p.getStock() == null || p.getStock() < line.getQty()) {
                throw new IllegalStateException("Insufficient stock for product: " + p.getName());
            }

            long pricePaise = getProductPricePaise(p);
            subtotal += pricePaise * line.getQty();

            OrderItem oi = new OrderItem();
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setPrice(pricePaise);
            oi.setQuantity(line.getQty());
            items.add(oi);
        }

        long shipping = (subtotal >= 49900) ? 0 : 4900;
        long codFee = "cod".equalsIgnoreCase(req.paymentMethod) ? 3000 : 0;
        long discount = couponService.computeDiscountPaise(
                req.couponCode,
                req.userId.toString(), // still string for coupon service
                items,
                subtotal
        );
        long total = Math.max(0, subtotal + shipping + codFee - discount);

        // 4) Address snapshot
        AddressDTO a = req.address;
        ShippingAddress ship = new ShippingAddress();
        ship.setLine1(a.addressLine1);
        ship.setLine2(a.addressLine2);
        ship.setCity(a.city);
        ship.setState(a.state);
        ship.setPincode(a.pincode);
        ship.setType(a.type);

        // 5) Build order
        Order o = new Order();
        o.setUser(user); // ✅ relation instead of string userId
        o.setCustomerName(a.fullName);
        o.setPhone(a.phone);
        o.setShippingAddress(ship);
        o.setSubtotal(subtotal);
        o.setShippingFee(shipping);
        o.setCodFee(codFee);
        o.setDiscount(discount);
        o.setTotalPayable(total);
        o.setStatus(Order.OrderStatus.DRAFT);
        o.setCreatedAt(Instant.now());
        o.setUpdatedAt(Instant.now());
        items.forEach(it -> it.setOrder(o));
        o.setItems(items);

        return orderRepo.save(o);
    }

    /** Called after Razorpay capture or for COD confirmation—this decrements stock atomically. */
    @Transactional
    public Order markPaid(Order o) {
        if (o.getStatus() == Order.OrderStatus.PAID || o.getStatus() == Order.OrderStatus.CONFIRMED) {
            return o;
        }

        // Decrement stock
        o.getItems().forEach(oi -> {
            Product p = productRepo.findByIdForUpdate(oi.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product missing: " + oi.getProductId()));

            if (p.getStock() == null || p.getStock() < oi.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for " + p.getName());
            }

            p.setStock(p.getStock() - oi.getQuantity());
            p.setInStock(p.getStock() > 0);
            productRepo.save(p);
        });

        // Mark order paid
        o.setStatus(Order.OrderStatus.PAID);
        o.setUpdatedAt(Instant.now());
        Order saved = orderRepo.save(o);

        // Clear user’s cart
        if (o.getUser() != null && o.getUser().getId() != null) {
            cartItemRepo.deleteByUser_Id(o.getUser().getId());
        }

        return saved;
    }

    /** For COD we treat it as confirmed immediately and also decrement stock. */
    @Transactional
    public Order confirmCOD(Order o) {
        if (o.getStatus() == Order.OrderStatus.CONFIRMED) return o;

        o.getItems().forEach(oi -> {
            Product p = productRepo.findByIdForUpdate(oi.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product missing: " + oi.getProductId()));
            if (p.getStock() == null || p.getStock() < oi.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for " + p.getName());
            }
            p.setStock(p.getStock() - oi.getQuantity());
            p.setInStock(p.getStock() > 0);
            productRepo.save(p);
        });

        o.setStatus(Order.OrderStatus.CONFIRMED);
        o.setUpdatedAt(Instant.now());
        Order saved = orderRepo.save(o);

        // Clear cart
        if (o.getUser() != null && o.getUser().getId() != null) {
            cartItemRepo.deleteByUser_Id(o.getUser().getId());
        }

        return saved;
    }

    // convert rupees → paise (long)
    private long toPaise(BigDecimal rupees) {
        if (rupees == null) return 0L;
        return rupees.multiply(BigDecimal.valueOf(100)).longValue();
    }

    /** Get effective product price (discount if available, else base). */
    private long getProductPricePaise(Product p) {
        BigDecimal effective = (p.getDiscountPrice() != null) ? p.getDiscountPrice() : p.getPrice();
        return toPaise(effective);
    }
}
