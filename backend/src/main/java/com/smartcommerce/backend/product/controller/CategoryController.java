package com.smartcommerce.backend.product.controller;

import com.smartcommerce.backend.product.entity.Category;
import com.smartcommerce.backend.product.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepo;

    public CategoryController(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    // Public: list all categories
    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepo.findAll();
    }

    // Public: get category by id
    @GetMapping("/{id}")
    public Category getCategoryById(@PathVariable Long id) {
        return categoryRepo.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
    }
}
