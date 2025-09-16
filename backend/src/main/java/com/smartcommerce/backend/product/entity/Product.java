package com.smartcommerce.backend.product.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;  // Poster name

    @Column(length = 1000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "product_photos", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "photo_url")
    private List<String> photos; // store URLs (at least 1, up to 5+)

    private BigDecimal price;

    private Double rating = 0.0; // avg rating, default 0

    // many posters belong to one category
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
}
