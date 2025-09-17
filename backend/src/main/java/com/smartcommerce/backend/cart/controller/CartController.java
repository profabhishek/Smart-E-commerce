package com.smartcommerce.backend.cart.controller;

import com.smartcommerce.backend.cart.dto.CartItemDTO;
import com.smartcommerce.backend.cart.dto.CartSummaryDTO;
import com.smartcommerce.backend.cart.service.CartService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public CartSummaryDTO getCart(@PathVariable Long userId) {
        return cartService.getCart(userId);
    }

    @PostMapping("/{userId}/add")
    public CartItemDTO addToCart(@PathVariable Long userId,
                                 @RequestParam Long productId,
                                 @RequestParam int quantity) {
        return cartService.addToCart(userId, productId, quantity);
    }

    @PutMapping("/{userId}/update")
    public CartItemDTO updateQuantity(@PathVariable Long userId,
                                      @RequestParam Long productId,
                                      @RequestParam int quantity) {
        return cartService.updateQuantity(userId, productId, quantity);
    }

    @DeleteMapping("/{userId}/remove")
    public void removeFromCart(@PathVariable Long userId,
                               @RequestParam Long productId) {
        cartService.removeFromCart(userId, productId);
    }

}
