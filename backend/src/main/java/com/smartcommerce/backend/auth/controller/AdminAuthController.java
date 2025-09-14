package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AdminLoginRequest;
import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.ForgotPasswordRequest;
import com.smartcommerce.backend.auth.dto.ResetPasswordRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import com.smartcommerce.backend.auth.security.JwtUtils;
import com.smartcommerce.backend.auth.service.PasswordResetService;
import com.smartcommerce.backend.auth.service.RecaptchaService;
import com.smartcommerce.backend.auth.service.EmailService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final PasswordResetService passwordResetService;
    private final UserRepository userRepo;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaService recaptchaService;
    private final EmailService emailService;

    public AdminAuthController(UserRepository userRepo,
                               JwtUtils jwtUtils,
                               PasswordEncoder passwordEncoder,
                               RecaptchaService recaptchaService,
                               EmailService emailService,
                               PasswordResetService passwordResetService) {
        this.userRepo = userRepo;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.recaptchaService = recaptchaService;
        this.emailService = emailService;
        this.passwordResetService = passwordResetService;
    }

    // ------------------ Admin Login ------------------
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AdminLoginRequest request,
                                              HttpServletResponse response) {

        // ✅ Step 1: Verify reCAPTCHA token
        if (!recaptchaService.verifyToken(request.getRecaptchaToken())) {
            return ResponseEntity.status(403)
                    .body(new AuthResponse("reCAPTCHA verification failed", false));
        }

        // ✅ Step 2: Find admin user
        User admin = userRepo.findByEmail(request.getEmail()).orElse(null);

        if (admin == null || !"ADMIN".equals(admin.getRole()) ||
                !passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse("Invalid admin credentials", false));
        }

        // ✅ Step 3: Generate JWT
        String token = jwtUtils.generateToken(admin.getId(), admin.getRole());

        // ✅ Put JWT in httpOnly cookie (admin_jwt)
        ResponseCookie cookie = ResponseCookie.from("admin_jwt", token)
                .httpOnly(true)
                .secure(false) // ⚠️ set true in production (HTTPS)
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // ✅ Step 4: Return full AuthResponse (token + userId + role)
        return ResponseEntity.ok(
                new AuthResponse("Admin login successful", true, token, admin.getId(), "ROLE_ADMIN", admin.getName())
        );
    }

    // ------------------ Forgot Password ------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean sent = emailService.sendPasswordReset(request.getEmail());
        if (sent) {
            return ResponseEntity.ok(new AuthResponse("Password reset link sent", true));
        }
        return ResponseEntity.badRequest().body(new AuthResponse("Email not found or failed to send", false));
    }

    // ------------------ Admin Logout ------------------
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("admin_jwt", "")
                .httpOnly(true)
                .secure(false) // ⚠️ set true in production
                .path("/")
                .maxAge(0) // expire immediately
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request);
    }
}
