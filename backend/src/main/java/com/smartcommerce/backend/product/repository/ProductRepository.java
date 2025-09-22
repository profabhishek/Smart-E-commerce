package com.smartcommerce.backend.product.repository;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.Category;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 🔑 Find by SKU
    Optional<Product> findBySku(String sku);

    // 🔍 Find all products in a category
    List<Product> findByCategory(Category category);

    // 🔍 Find all products by name (case insensitive search)
    List<Product> findByNameContainingIgnoreCase(String name);

    // 🔍 Find products in stock only
    List<Product> findByInStockTrue();

    // 🔍 Find products with price less than X
    List<Product> findByPriceLessThan(BigDecimal price);

    // 🔍 Find products with discount
    List<Product> findByDiscountPriceIsNotNull();

    // ⚡️ New: lock a product row when updating stock (to prevent overselling)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
