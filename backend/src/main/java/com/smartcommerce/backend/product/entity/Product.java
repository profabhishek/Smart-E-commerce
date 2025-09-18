package com.smartcommerce.backend.product.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔑 Unique product code
    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;  // Poster name

    @Column(length = 1000)
    private String description;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductPhoto> photos;

    // 💰 Pricing
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;

    // ⭐ Rating (average)
    @Column(nullable = false)
    private Double rating = 0.0;

    // 📦 Inventory
    private Integer stock;      // available quantity
    private Boolean inStock = true;

    // 📐 Size & Material
    private String size;        // e.g., A3, A2, 12x18 inch
    private String material;    // e.g., matte, glossy, canvas
    private Double width;       // optional, for precision
    private Double height;
    private Double weight;      // shipping weight

    // 🔖 Tags for search/SEO
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tags")
    private List<String> tags = new ArrayList<>();

    // 🕒 Tracking
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // many posters belong to one category
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    // ⚡ Auto set timestamps
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
