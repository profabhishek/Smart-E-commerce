package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AdminLoginRequest;
import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.auth.security.JwtUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final UserRepository userRepo;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthController(UserRepository userRepo,
                               JwtUtils jwtUtils,
                               PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
    }

    // ------------------ Admin Login ------------------
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AdminLoginRequest request,
                                              HttpServletResponse response) {

        User admin = userRepo.findByEmail(request.getEmail()).orElse(null);

        // Debug logs
        System.out.println("➡️ Admin login attempt: " + request.getEmail());
        if (admin != null) {
            System.out.println("✅ Found admin in DB: " + admin.getEmail() + ", role=" + admin.getRole());
            System.out.println("🔑 Password matches? " + passwordEncoder.matches(request.getPassword(), admin.getPassword()));
        }

        // Check if user exists, role is ADMIN, and password matches
        if (admin == null || !"ADMIN".equals(admin.getRole()) ||
                !passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse("Invalid admin credentials", false));
        }

        // ✅ Generate JWT with ADMIN role
        String token = jwtUtils.generateToken(admin.getId(), admin.getRole());

        // ✅ Put JWT in httpOnly cookie
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // ⚠️ set true in production (HTTPS)
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(
                new AuthResponse("Admin login successful", true, admin.getId())
        );
    }


    // ------------------ Admin Logout ------------------
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false) // ⚠️ true in production
                .path("/")
                .maxAge(0) // expire immediately
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }
}
