package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.LoginRequest;
import com.smartcommerce.backend.auth.dto.OtpRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Request OTP
    @PostMapping("/request-otp")
    public AuthResponse requestOtp(@RequestBody LoginRequest request) {
        authService.requestOtp(request.getEmail());
        return new AuthResponse("OTP sent (if email configured). Check console if dev.", true);
    }

    // Verify OTP → sets cookie instead of returning token
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpRequest request,
                                                  HttpServletResponse response) {
        System.out.println("verify-otp hit: " + request.getEmail() + " / " + request.getCode());
        User user = authService.verifyOtp(request.getEmail(), request.getCode());

        // Generate JWT
        String token = authService.generateJwtToken(user);

        // ✅ Use "user_jwt" instead of "jwt"
        ResponseCookie cookie = ResponseCookie.from("user_jwt", token)
                .httpOnly(true)
                .secure(false) // ⚠️ set true in production
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // ✅ Return role + token for frontend redirection
        AuthResponse authResponse = AuthResponse.builder()
                .message("User login successful")
                .success(true)
                .token(token)
                .userId(user.getId())
                .role("ROLE_USER")
                .name(user.getName())
                .email(user.getEmail())
                .expiresIn(86400L) // 24 hrs in seconds
                .build();

        return ResponseEntity.ok(authResponse);
    }

    // Logout method
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // ✅ Expire only the "user_jwt" cookie
        ResponseCookie cookie = ResponseCookie.from("user_jwt", "")
                .httpOnly(true)
                .secure(false) // ⚠️ true in prod
                .path("/")
                .maxAge(0) // expire immediately
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }
}
