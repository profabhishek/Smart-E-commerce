package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.auth.dto.AddressDTO;
import com.smartcommerce.backend.auth.entity.Address;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.order.dto.CreateDraftRequest;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.model.CartLine;
import com.smartcommerce.backend.order.repository.OrderRepository;
import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.ProductPhoto;
import com.smartcommerce.backend.product.repository.ProductPhotoRepository;
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
    private final ProductPhotoRepository productPhotoRepo;
    private final CartPort cartPort;
    private final CouponService couponService;
    private final CartItemRepository cartItemRepo;
    private final UserRepository userRepo;

    public CheckoutService(OrderRepository orderRepo,
                           ProductRepository productRepo,
                           ProductPhotoRepository productPhotoRepo,
                           CartPort cartPort,
                           CouponService couponService,
                           CartItemRepository cartItemRepo,
                           UserRepository userRepo) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.productPhotoRepo = productPhotoRepo;
        this.cartPort = cartPort;
        this.couponService = couponService;
        this.cartItemRepo = cartItemRepo;
        this.userRepo = userRepo;
    }

    public Order getOrderById(Long id) {
        return orderRepo.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    /** SECURE: Controller must pass the authenticated User. */
    @Transactional
    public Order createDraftFromRequest(User user, CreateDraftRequest req) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User must be logged in");
        }
        if (req == null || req.getAddress() == null) {
            throw new IllegalArgumentException("Address is required");
        }

        // ---- Load cart (authoritative) ----
        List<CartLine> cart = cartPort.loadUserCart(user.getId().toString());
        if (cart == null || cart.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        long subtotal = 0L;
        List<OrderItem> items = new ArrayList<>();

        for (CartLine line : cart) {
            Product p = productRepo.findById(line.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + line.getProductId()));

            if (line.getQty() <= 0) throw new IllegalArgumentException("Invalid quantity for product " + p.getId());
            if (p.getStock() == null || p.getStock() < line.getQty())
                throw new IllegalStateException("Insufficient stock for product: " + p.getName());

            long pricePaise = getProductPricePaise(p);
            subtotal += pricePaise * line.getQty();

            String photoUrl = productPhotoRepo.findByProduct_Id(p.getId()).stream()
                    .findFirst()
                    .map(ProductPhoto::getPhotoUrl)
                    .orElse("https://via.placeholder.com/300x300?text=No+Image");

            OrderItem oi = new OrderItem();
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setPrice(pricePaise);
            oi.setQuantity(line.getQty());
            oi.setProductPhoto(photoUrl);
            items.add(oi);
        }

        long shipping = (subtotal >= 49900) ? 0 : 4900;
        long codFee = "cod".equalsIgnoreCase(req.getPaymentMethod()) ? 3000 : 0;
        long discount = couponService.computeDiscountPaise(
                req.getCouponCode(), user.getId().toString(), items, subtotal);
        long total = Math.max(0, subtotal + shipping + codFee - discount);

        // ---- Build order snapshot address from DTO ----
        AddressDTO a = req.getAddress();

        ShippingAddress ship = new ShippingAddress();
        ship.setHouseNo(a.getHouseNo());
        ship.setArea(a.getArea());
        ship.setLandmark(a.getLandmark());
        ship.setCity(a.getCity());
        ship.setState(a.getState());
        ship.setCountry(a.getCountry());
        ship.setPinCode(a.getPinCode());
        ship.setType(isBlank(a.getType()) ? "HOME" : a.getType().toUpperCase());

        // ---- Decide order customerName/phone: prefer User; fallback to req (for order snapshot only) ----
        String orderCustomerName = !isBlank(user.getName()) ? user.getName() : safe(req.getCustomerName());
        String orderPhone        = !isBlank(user.getPhone()) ? user.getPhone() : safe(req.getPhone());

        Order o = new Order();
        o.setUser(user);
        o.setCustomerName(orderCustomerName);
        o.setPhone(orderPhone);
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

        // ---- Persist order first ----
        Order savedOrder = orderRepo.save(o);

        // ---- Always add a new address row to user's saved addresses ----
        Address newAddr = new Address();
        newAddr.setUser(user);
        newAddr.setHouseNo(a.getHouseNo());
        newAddr.setArea(a.getArea());
        newAddr.setLandmark(a.getLandmark());
        newAddr.setCity(a.getCity());
        newAddr.setState(a.getState());
        newAddr.setCountry(a.getCountry());
        newAddr.setPinCode(a.getPinCode());
        user.getAddresses().add(newAddr);

        // ---- ✅ NEW: If user's name/phone are blank, fill them from checkout once ----
        if (isBlank(user.getName()) && !isBlank(req.getCustomerName())) {
            user.setName(req.getCustomerName().trim());
        }
        if (isBlank(user.getPhone()) && !isBlank(req.getPhone())) {
            user.setPhone(req.getPhone().trim());
        }

        // Persist user (cascades address)
        userRepo.save(user);

        return savedOrder;
    }

    /** After online payment capture — decrement stock, mark PAID, clear cart. */
    @Transactional
    public Order markPaid(Order o) {
        if (o.getStatus() == Order.OrderStatus.PAID || o.getStatus() == Order.OrderStatus.CONFIRMED) {
            return o;
        }

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

        o.setStatus(Order.OrderStatus.PAID);
        o.setUpdatedAt(Instant.now());
        Order saved = orderRepo.save(o);

        if (o.getUser() != null && o.getUser().getId() != null) {
            cartItemRepo.deleteByUser_Id(o.getUser().getId());
        }
        return saved;
    }

    /** COD: decrement stock and mark CONFIRMED. */
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

        if (o.getUser() != null && o.getUser().getId() != null) {
            cartItemRepo.deleteByUser_Id(o.getUser().getId());
        }
        return saved;
    }

    // -------- mapping helpers --------
    private ShippingAddress toShippingAddress(AddressDTO a) {
        ShippingAddress ship = new ShippingAddress();
        ship.setHouseNo(safe(a.getHouseNo()));
        ship.setArea(safe(a.getArea()));
        ship.setLandmark(safe(a.getLandmark()));
        ship.setCity(safe(a.getCity()));
        ship.setState(safe(a.getState()));
        ship.setCountry(isBlank(a.getCountry()) ? "India" : a.getCountry().trim());
        ship.setPinCode(safe(a.getPinCode()));
        ship.setType(isBlank(a.getType()) ? "HOME" : a.getType().trim().toUpperCase());
        return ship;
    }

    private Address toAddressEntity(AddressDTO a, User user) {
        Address addr = new Address();
        addr.setUser(user);
        addr.setHouseNo(safe(a.getHouseNo()));
        addr.setArea(safe(a.getArea()));
        addr.setLandmark(safe(a.getLandmark()));
        addr.setCity(safe(a.getCity()));
        addr.setState(safe(a.getState()));
        addr.setCountry(isBlank(a.getCountry()) ? "India" : a.getCountry().trim());
        addr.setPinCode(safe(a.getPinCode()));
        return addr;
    }

    // -------- helpers --------
    private long toPaise(BigDecimal rupees) {
        if (rupees == null) return 0L;
        return rupees.movePointRight(2).longValue();
    }

    private long getProductPricePaise(Product p) {
        BigDecimal effective = (p.getDiscountPrice() != null) ? p.getDiscountPrice() : p.getPrice();
        return toPaise(effective);
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }
}
