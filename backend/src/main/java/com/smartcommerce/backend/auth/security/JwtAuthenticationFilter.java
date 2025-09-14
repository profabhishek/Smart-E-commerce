package com.smartcommerce.backend.auth.security;

import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip JWT validation for login endpoints
        return path.startsWith("/api/auth/") || path.startsWith("/api/admin/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        logger.info("➡️ Incoming request: {} {}", request.getMethod(), request.getRequestURI());

        String token = null;

        // 1️⃣ Authorization header
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            logger.info("🔑 Found JWT in Authorization header");
        }

        // 2️⃣ Cookie fallback: check both admin_jwt and user_jwt
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("admin_jwt".equals(cookie.getName()) || "user_jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    logger.info("🔑 Found JWT in cookie: {}", cookie.getName());
                }
            }
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (jwtUtils.validateToken(token)) {
                Long userId = jwtUtils.getUserIdFromToken(token);
                String role = jwtUtils.getRoleFromToken(token);

                User user = userRepo.findById(userId).orElse(null);

                if (user != null) {
                    GrantedAuthority authority = new SimpleGrantedAuthority(role); // role already has ROLE_ prefix

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(user, null, List.of(authority));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("🔐 Authentication set for {} with role {}", user.getEmail(), role);
                }
            }
        } catch (Exception e) {
            logger.error("❌ Error parsing JWT: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
