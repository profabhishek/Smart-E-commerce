package com.smartcommerce.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    @NotBlank @Email
    private String email;

    private String name;
    private String phone;

    // "USER" or "ADMIN" (default USER if null)
    private String role;

    // optional; for OTP users you can set true/false; for admin it will be forced true
    private Boolean verified;

    // ONLY required when role == ADMIN
    private String password;
}
