package com.smartcommerce.backend.auth.security;

import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.security.Keys;
import io.github.cdimascio.dotenv.Dotenv;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Dotenv dotenv = Dotenv.load();
    public static final String JWT_SECRET = dotenv.get("JWT_SECRET_KEY");
    private final SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());

    private final long JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 1 day

    // Generate token with role
    public String generateToken(Long userId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION_MS);

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("role", "ROLE_" + role)  // ✅ Prefix role once
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
