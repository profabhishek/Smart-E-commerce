package com.smartcommerce.backend.cart.service;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.cart.dto.CartItemDTO;
import com.smartcommerce.backend.cart.dto.CartSummaryDTO;
import com.smartcommerce.backend.cart.entity.CartItem;
import com.smartcommerce.backend.cart.repository.CartItemRepository;
import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {
    private final CartItemRepository cartRepo;
    private final UserRepository userRepo;
    private final ProductRepository productRepo;

    public CartService(CartItemRepository cartRepo, UserRepository userRepo, ProductRepository productRepo) {
        this.cartRepo = cartRepo;
        this.userRepo = userRepo;
        this.productRepo = productRepo;
    }

    // ✅ Add to cart
    @Transactional
    public CartItemDTO addToCart(Long userId, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be > 0");
        }

        User user = userRepo.getReferenceById(userId);
        Product product = productRepo.getReferenceById(productId);

        CartItem item = cartRepo.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> {
                    CartItem ci = new CartItem();
                    ci.setUser(user);
                    ci.setProduct(product);
                    ci.setQuantity(0);
                    return ci;
                });

        item.setQuantity(item.getQuantity() + quantity);
        CartItem saved = cartRepo.save(item);

        return new CartItemDTO(saved);
    }

    // ✅ Remove product
    @Transactional
    public void removeFromCart(Long userId, Long productId) {
        cartRepo.findByUserIdAndProductId(userId, productId)
                .ifPresent(cartRepo::delete);
    }

    // ✅ Update quantity
    @Transactional
    public CartItemDTO updateQuantity(Long userId, Long productId, int quantity) {
        CartItem item = cartRepo.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Item not found in cart"));

        if (quantity <= 0) {
            cartRepo.delete(item);
            return null;
        }

        item.setQuantity(quantity);
        CartItem saved = cartRepo.save(item);
        return new CartItemDTO(saved);
    }

    // ✅ Get user’s cart (with summary)
    public CartSummaryDTO getCart(Long userId) {
        List<CartItemDTO> items = cartRepo.findByUserId(userId)
                .stream()
                .map(CartItemDTO::new)
                .toList();

        return new CartSummaryDTO(items);
    }
}
