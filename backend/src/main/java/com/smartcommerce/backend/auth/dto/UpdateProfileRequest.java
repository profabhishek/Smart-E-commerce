package com.smartcommerce.backend.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class UpdateProfileRequest {

    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @Size(max = 15, message = "Phone number must be at most 15 digits")
    private String phone;

    // ✅ Multiple addresses instead of one
    private List<AddressDTO> addresses;
}
