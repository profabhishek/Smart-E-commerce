package com.smartcommerce.backend.product.controller;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ✅ Get all products (with optional category filter)
    @GetMapping
    public List<Product> getAllProducts(@RequestParam(required = false) Long categoryId) {
        if (categoryId != null) {
            return productService.getProductsByCategory(categoryId);
        }
        return productService.getAllProducts();
    }

    // ✅ Get product by ID
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // ✅ Create product
    @PostMapping
    public Product createProduct(@RequestBody Product product,
                                 @RequestParam(required = false) Long categoryId) {
        return productService.createProduct(product, categoryId);
    }

    // ✅ Update product
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id,
                                 @RequestBody Product updatedProduct,
                                 @RequestParam(required = false) Long categoryId) {
        return productService.updateProduct(id, updatedProduct, categoryId);
    }

    // ✅ Delete product
    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return "Product deleted successfully";
    }
}
