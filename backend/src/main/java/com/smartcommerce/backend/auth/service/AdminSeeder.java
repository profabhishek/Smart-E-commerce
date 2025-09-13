package com.smartcommerce.backend.auth.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;

@Configuration
public class AdminSeeder {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepo.findByEmail("admin@mysite.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@mysite.com");
                admin.setRole("ADMIN");
                admin.setVerified(true); // must be verified
                admin.setPassword(passwordEncoder.encode("Admin@123")); // 👈 hash happens here
                userRepo.save(admin);
                System.out.println("✅ Admin user created: admin@mysite.com / Admin@123");
            }
        };
    }
}
