package com.smartcommerce.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private boolean success;
    private String token;
    private Long userId;
    private String role;   // 👈 role included for frontend redirects

    // Minimal response (without token/role/userId)
    public AuthResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    // Response with message + success + userId
    public AuthResponse(String message, boolean success, Long userId) {
        this.message = message;
        this.success = success;
        this.userId = userId;
    }
}
