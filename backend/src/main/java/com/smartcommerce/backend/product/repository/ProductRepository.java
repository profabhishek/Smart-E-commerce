package com.smartcommerce.backend.product.repository;

import com.smartcommerce.backend.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {}
