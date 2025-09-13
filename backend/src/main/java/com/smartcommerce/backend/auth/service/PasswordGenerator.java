package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordGenerator {

    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    UserRepository userRepo;

    public void resetAdminPassword() {
        User admin = userRepo.findByEmail("admin@mysite.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        userRepo.save(admin);
    }

    @Bean
    CommandLineRunner resetPasswordRunner() {
        return args -> resetAdminPassword();
    }


}
