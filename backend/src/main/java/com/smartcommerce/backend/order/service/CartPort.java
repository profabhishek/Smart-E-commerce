package com.smartcommerce.backend.order.service;

import com.smartcommerce.backend.order.model.CartLine;
import java.util.List;

public interface CartPort {
    List<CartLine> loadUserCart(String userId);
}
