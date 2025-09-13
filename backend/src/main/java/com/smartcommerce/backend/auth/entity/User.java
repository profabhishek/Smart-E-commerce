package com.smartcommerce.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private boolean isVerified;

    private String name;
    private String phone;

    // 👇 Role field
    @Column(nullable = false)
    private String role = "USER"; // USER or ADMIN

    @Column
    private String password; // only required for ADMIN accounts

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

    // ---------------- UserDetails methods for Spring Security ----------------

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password; // For admin accounts, password is stored
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isVerified;
    }
}
