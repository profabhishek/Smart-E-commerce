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

        // ✅ Put JWT into httpOnly cookie
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // ⚠️ false for localhost, true in production
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day expiry
                .sameSite("Lax")      // works with localhost + React
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // ✅ Return success response WITHOUT token
        String msg = "Login successful";
        AuthResponse authResponse = new AuthResponse(msg, true, user.getId());

        return ResponseEntity.ok(authResponse);
    }


    // Logout method
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false) // ⚠️ true in prod
                .path("/")
                .maxAge(0)     // 👈 expire immediately
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }
}
