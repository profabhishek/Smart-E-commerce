package com.smartcommerce.backend.product.repository;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.ProductPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductPhotoRepository extends JpaRepository<ProductPhoto, Long> {
    List<ProductPhoto> findByProduct_Id(Long productId);
    void deleteByProduct(Product product);
}
