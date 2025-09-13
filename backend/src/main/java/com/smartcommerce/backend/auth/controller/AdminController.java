package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.CreateAdminRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // Existing test endpoint
    @GetMapping("/hello")
    public String helloAdmin() {
        return "Hello Admin!";
    }

    // ✅ New: Create another admin
    @PostMapping("/create-admin")
    public ResponseEntity<String> createAdmin(@RequestBody CreateAdminRequest request) {
        if (userRepo.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Admin already exists with email: " + request.getEmail());
        }

        User newAdmin = new User();
        newAdmin.setEmail(request.getEmail());
        newAdmin.setVerified(true); // mark as verified so they can login
        newAdmin.setRole("ADMIN");
        newAdmin.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepo.save(newAdmin);

        return ResponseEntity.ok("New admin created: " + request.getEmail());
    }
}
