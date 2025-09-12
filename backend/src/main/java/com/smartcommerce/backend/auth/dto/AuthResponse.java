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
    private Long userId;

    public AuthResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }
}
