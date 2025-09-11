package com.smartcommerce.backend.auth.repository;

import com.smartcommerce.backend.auth.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findByEmailAndCode(String email, String code);
    List<Otp> findByEmail(String email);
    void deleteByEmail(String email);
}