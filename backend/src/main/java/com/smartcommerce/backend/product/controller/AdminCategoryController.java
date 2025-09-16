package com.smartcommerce.backend.product.controller;

import com.smartcommerce.backend.product.entity.Category;
import com.smartcommerce.backend.product.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final CategoryRepository categoryRepo;

    public AdminCategoryController(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    // Admin: create category
    @PostMapping
    public Category createCategory(@RequestBody Category category) {
        // all fields: name, description, icon
        return categoryRepo.save(category);
    }

    // Admin: update category
    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category updatedCategory) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(updatedCategory.getName());
        category.setDescription(updatedCategory.getDescription());
        category.setIcon(updatedCategory.getIcon()); // ✅ update icon too

        return categoryRepo.save(category);
    }

    // Admin: delete category
    @DeleteMapping("/{id}")
    public String deleteCategory(@PathVariable Long id) {
        categoryRepo.deleteById(id);
        return "Category deleted successfully!";
    }
}
