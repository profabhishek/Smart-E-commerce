package com.smartcommerce.backend.auth.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Address {
    private String country;
    private String state;
    private String city;
    private String area;
    private String houseNo;
    private String landmark;
}