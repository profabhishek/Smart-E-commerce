package com.smartcommerce.backend.auth.dto;

import com.smartcommerce.backend.auth.entity.Address;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private Address address;
}

