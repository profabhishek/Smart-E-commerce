package com.smartcommerce.backend.product.controller;

import com.smartcommerce.backend.product.entity.Product;
import com.smartcommerce.backend.product.entity.ProductPhoto;
import com.smartcommerce.backend.product.repository.ProductPhotoRepository;
import com.smartcommerce.backend.product.repository.ProductRepository;
import com.smartcommerce.backend.product.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final ProductPhotoRepository productPhotoRepository;

    private final String uploadDir = "uploads/productPhotos/";

    public AdminProductController(ProductService productService,
                                  ProductRepository productRepository,
                                  ProductPhotoRepository productPhotoRepository) {
        this.productService = productService;
        this.productRepository = productRepository;
        this.productPhotoRepository = productPhotoRepository;
    }

    // Get all products for a given category
    @GetMapping
    public List<Product> getProductsByCategory(@RequestParam Long categoryId) {
        return productService.getProductsByCategory(categoryId);
    }

    // Create new product
    @PostMapping
    public Product createProduct(@RequestBody Product product, @RequestParam Long categoryId) {
        return productService.createProduct(product, categoryId);
    }

    // Update product
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id,
                                 @RequestBody Product updatedProduct,
                                 @RequestParam Long categoryId) {
        return productService.updateProduct(id, updatedProduct, categoryId);
    }

    // Delete product
    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return "Product deleted successfully!";
    }

    // 📸 Upload product photos
// 📸 Upload product photos
    @PostMapping("/{productId}/photos")
    public ResponseEntity<?> uploadProductPhotos(
            @PathVariable Long productId,
            @RequestParam("files") List<MultipartFile> files) {

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Product not found"));
        }
        Product product = productOpt.get();

        List<String> urls = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                // generate unique filename
                String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();

                // save file to local uploads dir
                Path path = Paths.get(uploadDir, filename);
                Files.createDirectories(path.getParent());
                Files.write(path, file.getBytes());

                // build public URL (with server host)
                String url = "http://localhost:8082/uploads/productPhotos/" + filename;

                // save into DB
                ProductPhoto photo = new ProductPhoto();
                photo.setProduct(product);
                photo.setPhoto_url(url);
                productPhotoRepository.save(photo);

                urls.add(url);
            }

            return ResponseEntity.ok(Map.of("urls", urls));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed"));
        }
    }

    // 🗑️ Delete a specific photo
    @DeleteMapping("/{productId}/photos/{photoId}")
    public ResponseEntity<?> deleteProductPhoto(
            @PathVariable Long productId,
            @PathVariable Long photoId) {

        Optional<ProductPhoto> photoOpt = productPhotoRepository.findById(photoId);
        if (photoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Photo not found"));
        }

        ProductPhoto photo = photoOpt.get();
        if (!photo.getProduct().getId().equals(productId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Photo does not belong to this product"));
        }

        // delete file from server
        try {
            Path path = Paths.get("uploads", photo.getPhoto_url().replace("/uploads/", ""));
            Files.deleteIfExists(path);
        } catch (Exception e) {
            e.printStackTrace(); // log only
        }

        productPhotoRepository.delete(photo);

        return ResponseEntity.ok(Map.of("message", "Photo deleted"));
    }

}
