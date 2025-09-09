package com.smartcommerce.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private boolean isVerified;

    private String name;
    private String phone;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "country", column = @Column(name = "address_country")),
            @AttributeOverride(name = "state", column = @Column(name = "address_state")),
            @AttributeOverride(name = "city", column = @Column(name = "address_city")),
            @AttributeOverride(name = "area", column = @Column(name = "address_area")),
            @AttributeOverride(name = "houseNo", column = @Column(name = "address_house_no")),
            @AttributeOverride(name = "landmark", column = @Column(name = "address_landmark"))
    })
    private Address address;
}