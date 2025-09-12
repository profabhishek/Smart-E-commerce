package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.LoginRequest;
import com.smartcommerce.backend.auth.dto.OtpRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Request OTP 1
    @PostMapping("/request-otp")
    public AuthResponse requestOtp(@RequestBody LoginRequest request) {
        authService.requestOtp(request.getEmail());
        return new AuthResponse("OTP sent (if email configured). Check console if dev.", true);
    }

    // Verify OTP
    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody OtpRequest request) {
        System.out.println("verify-otp hit: " + request.getEmail() + " / " + request.getCode());
        User user = authService.verifyOtp(request.getEmail(), request.getCode());

        // Generate JWT for this user
        String token = authService.generateJwtToken(user);

        // Return both token and userId
        String msg = "Login successful";
        return new AuthResponse(msg, true, user.getId());
    }
}