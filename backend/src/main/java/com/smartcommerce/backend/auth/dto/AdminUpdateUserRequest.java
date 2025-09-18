package com.smartcommerce.backend.auth.dto;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String name;
    private String phone;
    private String role;       // "USER" or "ADMIN"
    private Boolean verified;  // optional
    private String newPassword; // if role == ADMIN and you want to reset/set password
}
