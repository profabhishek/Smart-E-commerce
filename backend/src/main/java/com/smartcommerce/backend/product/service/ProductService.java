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

    // CREATE
// CREATE
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

        // ensure SKU is unique
        if (product.getSku() == null || productRepo.findBySku(product.getSku()).isPresent()) {
            throw new RuntimeException("SKU must be unique and not null");
        }

        // 🔑 Attach product to each photo before saving
        if (product.getPhotos() != null) {
            product.getPhotos().forEach(photo -> photo.setProduct(product));
        }

        return productRepo.save(product);
    }

    // READ ALL
    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    // READ ONE
    public Product getProductById(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // DELETE
    public void deleteProduct(Long id) {
        if (!productRepo.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepo.deleteById(id);
    }

    // READ BY CATEGORY (better: use repo directly instead of filtering in memory)
    public List<Product> getProductsByCategory(Long categoryId) {
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return productRepo.findByCategory(category);
    }

    // UPDATE
// UPDATE
    public Product updateProduct(Long id, Product updatedProduct, Long categoryId) {
        Product existing = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (updatedProduct.getName() != null) existing.setName(updatedProduct.getName());
        if (updatedProduct.getDescription() != null) existing.setDescription(updatedProduct.getDescription());

        if (updatedProduct.getPhotos() != null) {
            // clear old photos and replace with new ones
            existing.getPhotos().clear();
            updatedProduct.getPhotos().forEach(photo -> photo.setProduct(existing));
            existing.getPhotos().addAll(updatedProduct.getPhotos());
        }

        if (updatedProduct.getPrice() != null) existing.setPrice(updatedProduct.getPrice());
        if (updatedProduct.getDiscountPrice() != null) existing.setDiscountPrice(updatedProduct.getDiscountPrice());
        if (updatedProduct.getRating() != null) existing.setRating(updatedProduct.getRating());
        if (updatedProduct.getStock() != null) existing.setStock(updatedProduct.getStock());
        if (updatedProduct.getSize() != null) existing.setSize(updatedProduct.getSize());
        if (updatedProduct.getMaterial() != null) existing.setMaterial(updatedProduct.getMaterial());
        if (updatedProduct.getWidth() != null) existing.setWidth(updatedProduct.getWidth());
        if (updatedProduct.getHeight() != null) existing.setHeight(updatedProduct.getHeight());
        if (updatedProduct.getWeight() != null) existing.setWeight(updatedProduct.getWeight());
        if (updatedProduct.getTags() != null) existing.setTags(updatedProduct.getTags());

        if (updatedProduct.getSku() != null && !updatedProduct.getSku().equals(existing.getSku())) {
            if (productRepo.findBySku(updatedProduct.getSku()).isPresent()) {
                throw new RuntimeException("SKU already exists");
            }
            existing.setSku(updatedProduct.getSku());
        }

        // Category update
        if (categoryId != null) {
            Category category = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            existing.setCategory(category);
        }

        return productRepo.save(existing);
    }
}
