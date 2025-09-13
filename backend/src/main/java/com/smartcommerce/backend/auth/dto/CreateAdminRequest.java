package com.smartcommerce.backend.auth.dto;

import lombok.Data;

@Data
public class CreateAdminRequest {
    private String email;
    private String password; // raw password, will be hashed
}
