package com.smartcommerce.backend.product.service;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.Category;
import com.smartcommerce.backend.product.repository.ProductRepository;
import com.smartcommerce.backend.product.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;

    public ProductService(ProductRepository productRepo, CategoryRepository categoryRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
    }

    public Product createProduct(Product product, Long categoryId) {
        Category category;

        if (categoryId == null) {
            category = categoryRepo.findByName("General")
                    .orElseThrow(() -> new RuntimeException("Default category not found"));
        } else {
            category = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        product.setCategory(category);
        return productRepo.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    public Product getProductById(Long id) {
        return productRepo.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public void deleteProduct(Long id) {
        productRepo.deleteById(id);
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepo.findAll().stream()
                .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(categoryId))
                .toList();
    }

    public Product updateProduct(Long id, Product updatedProduct, Long categoryId) {
        Product existing = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        existing.setName(updatedProduct.getName());
        existing.setDescription(updatedProduct.getDescription());
        existing.setPhotos(updatedProduct.getPhotos());
        existing.setPrice(updatedProduct.getPrice());
        existing.setRating(updatedProduct.getRating());

        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        existing.setCategory(category);

        return productRepo.save(existing);
    }

}
