package com.smartcommerce.backend.product.repository;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.ProductPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductPhotoRepository extends JpaRepository<ProductPhoto, Long> {

    // 🔍 Get all photos for a product
    List<ProductPhoto> findByProduct(Product product);

    // 🔍 Delete all photos for a product
    void deleteByProduct(Product product);
}
