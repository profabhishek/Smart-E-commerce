package com.smartcommerce.backend.order.dto;

import lombok.Data;

@Data
public class AddressDTO {
    private String fullName;
    private String phone;
    private String pincode;
    private String addressLine1;  // House/Flat, Street, Area
    private String addressLine2;  // Apartment / Landmark
    private String city;
    private String state;
    private String type; // home/work/other
}
