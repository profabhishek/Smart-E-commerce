package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.ResetPasswordRequest;
import com.smartcommerce.backend.auth.entity.PasswordResetToken;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.PasswordResetTokenRepository;
import com.smartcommerce.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    /**
     * Reset password using a valid token.
     */
    public ResponseEntity<AuthResponse> resetPassword(ResetPasswordRequest request) {
        // 1. Validate token
        PasswordResetToken tokenEntity = tokenRepo.findByToken(request.getToken()).orElse(null);
        if (tokenEntity == null) {
            return ResponseEntity.badRequest().body(new AuthResponse("Invalid reset token", false));
        }
        if (tokenEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            tokenRepo.delete(tokenEntity); // cleanup expired token
            return ResponseEntity.badRequest().body(new AuthResponse("Reset token expired", false));
        }

        // 2. Find user by email stored in token
        User user = userRepo.findByEmail(tokenEntity.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new AuthResponse("User not found", false));
        }

        // 3. Validate new password strength
        String newPassword = request.getNewPassword();
        if (!isValidPassword(newPassword)) {
            return ResponseEntity.badRequest().body(
                    new AuthResponse("Password must be at least 8 chars, contain 1 uppercase, 1 number, and 1 special character", false)
            );
        }

        // 4. Encode & update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // 5. Invalidate token
        tokenRepo.delete(tokenEntity);

        System.out.println("✅ Password reset successful for: " + user.getEmail());
        return ResponseEntity.ok(new AuthResponse("Password reset successful", true));
    }

    /**
     * Password policy: min 8 chars, at least 1 uppercase, 1 digit, 1 special char.
     */
    private boolean isValidPassword(String password) {
        if (password == null) return false;
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
        return Pattern.matches(regex, password);
    }

    @Scheduled(cron = "0 0 * * * ?") // every hour
    public void cleanExpiredTokens() {
        int deleted = tokenRepo.deleteByExpiryTimeBefore(LocalDateTime.now());
        System.out.println("🗑️ Cleaned up " + deleted + " expired reset tokens");
    }

}
