package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.entity.PasswordResetToken;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.PasswordResetTokenRepository;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepo;

    private final PasswordResetTokenRepository tokenRepo;

    public EmailService(JavaMailSender mailSender, UserRepository userRepo, PasswordResetTokenRepository tokenRepo) {
        this.mailSender = mailSender;
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
    }


    // ------------------ OTP ------------------
    public void sendOtp(String toEmail, String code) {
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("Your SmartCommerce OTP");
                message.setText("Your OTP is: " + code + " (valid for 5 minutes)");
                mailSender.send(message);
                System.out.println("✅ Sent OTP to " + toEmail);
                return;
            } catch (Exception ex) {
                System.out.println("⚠️ Email failed, falling back to console...");
            }
        }
        sendOtpConsole(toEmail, code);
    }

    public void sendOtpConsole(String toEmail, String code) {
        System.out.println("---- OTP (DEV MODE) ----");
        System.out.println("To: " + toEmail);
        System.out.println("OTP: " + code);
        System.out.println("------------------------");
    }

    // ------------------ Forgot Password ------------------
    public boolean sendPasswordReset(String email) {
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty() || !"ADMIN".equals(userOpt.get().getRole())) {
            return false;
        }

        // Clear old tokens for this email
        tokenRepo.deleteByEmail(email);

        // Create new token
        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setToken(resetToken);
        tokenEntity.setEmail(email);
        tokenEntity.setExpiryTime(LocalDateTime.now().plusMinutes(15));
        tokenRepo.save(tokenEntity);

        String resetLink = "http://localhost:5173/admin/reset-password?token=" + resetToken;

        try {
            if (mailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Password Reset Request - SmartCommerce");
                message.setText("Click the link below to reset your password:\n\n" + resetLink +
                        "\n\nThis link will expire in 15 minutes.");
                mailSender.send(message);
                System.out.println("✅ Sent reset link to " + email);
                return true;
            }
        } catch (Exception ex) {
            System.out.println("⚠️ Email send failed: " + ex.getMessage());
        }

        // Fallback for dev mode
        System.out.println("---- RESET LINK (DEV MODE) ----");
        System.out.println("To: " + email);
        System.out.println("Reset Link: " + resetLink);
        System.out.println("-------------------------------");
        return true;
    }

}
