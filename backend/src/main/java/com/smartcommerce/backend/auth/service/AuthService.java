    package com.smartcommerce.backend.auth.service;

    import com.smartcommerce.backend.auth.entity.Otp;
    import com.smartcommerce.backend.auth.entity.User;
    import com.smartcommerce.backend.auth.repository.OtpRepository;
    import com.smartcommerce.backend.auth.repository.UserRepository;
    import com.smartcommerce.backend.auth.security.JwtUtils;
    import io.jsonwebtoken.Jwts;
    import io.jsonwebtoken.SignatureAlgorithm;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.security.SecureRandom;
    import java.time.LocalDateTime;
    import java.util.Date;
    import io.jsonwebtoken.security.Keys;
    import javax.crypto.SecretKey;


    @Service
    @RequiredArgsConstructor
    public class AuthService {

        private final UserRepository userRepo;
        private final OtpRepository otpRepo;
        private final EmailService emailService;
        private final SecureRandom random = new SecureRandom();

        // JWT secret and expiration
        private final JwtUtils jwtUtils;

        /**
         * Request OTP: create user if not exists, generate otp, save, send
         */
        @Transactional
        public void requestOtp(String email) {
            // Ensure user exists
            User user = userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setVerified(false);
                u.setRole("USER");
                return userRepo.save(u);
            });

            // Clear previous OTPs
            otpRepo.deleteByEmail(email);

            // Generate 6-digit OTP
            String otpCode = String.valueOf(100000 + random.nextInt(900000));

            // Save OTP
            Otp otp = new Otp();
            otp.setEmail(email);
            otp.setCode(otpCode);
            otp.setExpiryTime(LocalDateTime.now().plusMinutes(5));
            otpRepo.save(otp);

            // Try sending OTP
            try {
                emailService.sendOtp(email, otpCode);
            } catch (Exception e) {
                System.err.println("⚠️ Email sending failed, fallback to console: " + e.getMessage());
                emailService.sendOtpConsole(email, otpCode);
            }
        }

        /**
         * Verify OTP: check, expiry, mark user verified, delete OTPs
         */
        @Transactional
        public User verifyOtp(String email, String code) {
            Otp otp = otpRepo.findByEmailAndCode(email, code)
                    .orElseThrow(() -> new RuntimeException("Invalid OTP"));

            if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("OTP expired");
            }

            User user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setVerified(true);
            userRepo.save(user);

            // Clear OTPs
            otpRepo.deleteByEmail(email);

            return user;
        }

        /**
         * Generate JWT token for user
         */
        public String generateJwtToken(User user) {
            return jwtUtils.generateToken(user.getId(), user.getRole()); // 👈 stable secret used
        }
    }
