package com.smartcommerce.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String message;
    private boolean success;
    private String token;
    private Long userId;

    // When you don’t want to return token or userId
    public AuthResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    // ✅ New constructor → message + success + userId
    public AuthResponse(String message, boolean success, Long userId) {
        this.message = message;
        this.success = success;
        this.userId = userId;
    }
}
