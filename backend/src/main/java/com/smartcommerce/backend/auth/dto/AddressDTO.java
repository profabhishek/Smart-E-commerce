package com.smartcommerce.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddressDTO {
    private Long id;        // Needed to identify which address to edit
    private String houseNo;
    private String area;
    private String landmark;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String type;
}
