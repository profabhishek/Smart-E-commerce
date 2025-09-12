package com.smartcommerce.backend.auth.security;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final UserRepository userRepo;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, UserRepository userRepo) {
        this.jwtUtils = jwtUtils;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        logger.info("➡️ Incoming request: {} {}", request.getMethod(), request.getRequestURI());

        String path = request.getServletPath();

        if (path.startsWith("/api/auth/")) {
            logger.info("Skipping JWT filter for auth path: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header == null) {
            logger.warn("❌ No Authorization header present");
            filterChain.doFilter(request, response);
            return;
        }

        if (!header.startsWith("Bearer ")) {
            logger.warn("❌ Invalid Authorization header format: {}", header);
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        logger.info("🔑 Extracted JWT: {}", token);

        try {
            if (jwtUtils.validateToken(token)) {
                Long userId = jwtUtils.getUserIdFromToken(token);
                logger.info("✅ Token valid. UserId = {}", userId);

                User user = userRepo.findById(userId).orElse(null);

                if (user != null) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(user, null, List.of());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("🔐 Authentication set for {}", user.getEmail());
                } else {
                    logger.warn("❌ JWT valid but user not found: ID {}", userId);
                }
            } else {
                logger.warn("❌ Invalid JWT token");
            }
        } catch (Exception e) {
            logger.error("❌ Error parsing JWT: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

}