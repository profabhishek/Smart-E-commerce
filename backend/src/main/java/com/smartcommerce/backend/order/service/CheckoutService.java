package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.order.dto.AddressDTO;
import com.smartcommerce.backend.order.dto.CreateDraftRequest;
import com.smartcommerce.backend.order.dto.GstDTO;
import com.smartcommerce.backend.order.entity.Order;
import com.smartcommerce.backend.order.entity.OrderItem;
import com.smartcommerce.backend.order.entity.ShippingAddress;
import com.smartcommerce.backend.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutService {

    private final OrderRepository orderRepo;
    // TODO: inject real repos/services to fetch products & cart server-side
    public CheckoutService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    @Transactional
    public Order createDraftFromRequest(CreateDraftRequest req) {
        // 1) Map address snapshot
        AddressDTO a = req.address;
        ShippingAddress ship = new ShippingAddress();
        ship.setLine1(a.addressLine1);
        ship.setLine2(a.addressLine2);
        ship.setCity(a.city);
        ship.setState(a.state);
        ship.setPincode(a.pincode);
        ship.setType(a.type);

        // 2) Recompute pricing from DB (BEGINNER SAFE STUB)
        // Replace this block: load user's cart from DB and price using authoritative product prices
        List<OrderItem> items = new ArrayList<>();
        long subtotal = 0L;
        // TODO: populate items from your Cart tables with (productId, name, pricePaise, qty)

        long shipping = (subtotal >= 49900) ? 0 : 4900; // ₹49 under ₹499
        long codFee = "cod".equalsIgnoreCase(req.paymentMethod) ? 3000 : 0;
        long discount = 0L; // TODO: integrate coupon rules (min cart value, per-user limits, exclusions)
        long total = Math.max(0, subtotal + shipping + codFee - discount);

        // 3) Build order
        Order o = new Order();
        o.setUserId(req.userId != null ? req.userId : "guest");
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

        for (OrderItem it : items) it.setOrder(o);
        o.setItems(items);

        // 4) Optional GST snapshot
        GstDTO gst = req.gst;
        if (gst != null && gst.addGst) {
            // store via extra fields if you add them to Order (gstInvoice, gstin, businessName)
            // left out if your Order entity didn't include yet
        }

        return orderRepo.save(o);
    }

    @Transactional
    public Order markPaid(Order o) {
        o.setStatus(Order.OrderStatus.PAID);
        o.setUpdatedAt(Instant.now());
        // TODO: reduce stock atomically here for each OrderItem
        return orderRepo.save(o);
    }

    @Transactional
    public Order confirmCOD(Order o) {
        o.setStatus(Order.OrderStatus.CONFIRMED);
        o.setUpdatedAt(Instant.now());
        // TODO: reduce stock here as well
        return orderRepo.save(o);
    }

    public Order getOrderById(Long id) {
        return orderRepo.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }
}
