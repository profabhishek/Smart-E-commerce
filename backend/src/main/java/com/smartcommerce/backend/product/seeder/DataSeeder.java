package com.smartcommerce.backend.product.seeder;

import com.smartcommerce.backend.product.entity.Category;
import com.smartcommerce.backend.product.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    private final CategoryRepository categoryRepo;

    public DataSeeder(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    @Bean
    CommandLineRunner seedCategories() {
        return args -> {
            if (categoryRepo.count() == 0) {
                Category defaultCat = new Category();
                defaultCat.setName("General");
                defaultCat.setDescription("Default category for posters");
                categoryRepo.save(defaultCat);
                System.out.println("✅ Default category created: General");
            }
        };
    }
}
