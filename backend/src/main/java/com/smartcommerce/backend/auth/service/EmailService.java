package com.smartcommerce.backend.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class EmailService {

    // `required = false` makes it optional → app won’t crash if not configured
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

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

        // fallback for dev
        sendOtpConsole(toEmail, code);
    }

    public void sendOtpConsole(String toEmail, String code) {
        System.out.println("---- OTP (DEV MODE) ----");
        System.out.println("To: " + toEmail);
        System.out.println("OTP: " + code);
        System.out.println("------------------------");
    }
}
