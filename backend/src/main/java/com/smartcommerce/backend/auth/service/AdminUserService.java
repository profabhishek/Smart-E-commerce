// src/main/java/com/smartcommerce/backend/auth/service/AdminUserService.java
package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.dto.AdminCreateUserRequest;
import com.smartcommerce.backend.auth.dto.AdminUpdateUserRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    private static String normalizeRole(String role) {
        if (role == null || role.isBlank()) return "USER";
        role = role.trim().toUpperCase();
        if (!role.equals("USER") && !role.equals("ADMIN")) {
            throw new IllegalArgumentException("Role must be USER or ADMIN");
        }
        return role;
    }

    // CREATE
    public User create(AdminCreateUserRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        String role = normalizeRole(req.getRole());
        User u = new User();
        u.setEmail(req.getEmail());
        u.setName(req.getName());
        u.setPhone(req.getPhone());
        u.setRole(role);

        if ("ADMIN".equals(role)) {
            if (req.getPassword() == null || req.getPassword().isBlank()) {
                throw new RuntimeException("Password is required for ADMIN accounts");
            }
            u.setPassword(passwordEncoder.encode(req.getPassword()));
            u.setVerified(true); // admins should be enabled immediately
        } else {
            // USER → OTP-only: do not store password
            u.setPassword(null);
            u.setVerified(Boolean.TRUE.equals(req.getVerified())); // or false by default
        }

        return userRepo.save(u);
    }

    // READ
    public List<User> list() {
        return userRepo.findAll();
    }

    public User get(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // UPDATE
    public User update(Long id, AdminUpdateUserRequest req) {
        User u = get(id);

        if (req.getName() != null)  u.setName(req.getName());
        if (req.getPhone() != null) u.setPhone(req.getPhone());
        if (req.getVerified() != null) u.setVerified(req.getVerified());

        if (req.getRole() != null) {
            String newRole = normalizeRole(req.getRole());
            String oldRole = u.getRole();

            u.setRole(newRole);

            if ("ADMIN".equals(newRole)) {
                // Ensure admin has a password
                if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
                    u.setPassword(passwordEncoder.encode(req.getNewPassword()));
                } else if (u.getPassword() == null || u.getPassword().isBlank()) {
                    throw new RuntimeException("ADMIN must have a password; provide newPassword");
                }
                u.setVerified(true);
            } else {
                // Demote to USER → make it OTP-only
                u.setPassword(null);
            }
        } else {
            // Role unchanged; support password reset for existing admin
            if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
                if (!"ADMIN".equals(u.getRole())) {
                    throw new RuntimeException("Only ADMIN users can have passwords");
                }
                u.setPassword(passwordEncoder.encode(req.getNewPassword()));
            }
        }

        return userRepo.save(u);
    }

    // DELETE
    public void delete(Long id) {
        userRepo.deleteById(id);
    }
}
