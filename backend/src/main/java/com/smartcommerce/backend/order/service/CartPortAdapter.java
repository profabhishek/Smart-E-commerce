package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.cart.entity.CartItem;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.order.model.CartLine;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartPortAdapter implements CartPort {

    private final CartItemRepository cartItemRepo;

    public CartPortAdapter(CartItemRepository cartItemRepo) {
        this.cartItemRepo = cartItemRepo;
    }

    @Override
    public List<CartLine> loadUserCart(String userId) {
        Long uid = Long.valueOf(userId); // 🔑 your User.id is Long
        List<CartItem> cartItems = cartItemRepo.findByUser_Id(uid);

        return cartItems.stream()
                .map(ci -> new CartLine(ci.getProduct().getId(), ci.getQuantity()))
                .collect(Collectors.toList());
    }
}
