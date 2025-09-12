package com.smartcommerce.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
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
        return Collections.emptyList(); // no roles yet, can add later
    }

    @Override
    public String getPassword() {
        return null; // OTP login, no password
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // always active
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // always unlocked
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // OTP login, no credentials expiration
    }

    @Override
    public boolean isEnabled() {
        return isVerified; // only verified users are enabled
    }
}
