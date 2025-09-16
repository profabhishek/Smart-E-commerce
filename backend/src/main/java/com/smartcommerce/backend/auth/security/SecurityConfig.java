    package com.smartcommerce.backend.auth.security;

    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.config.http.SessionCreationPolicy;
    import org.springframework.security.web.SecurityFilterChain;
    import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
    import org.springframework.web.cors.CorsConfiguration;
    import org.springframework.web.cors.CorsConfigurationSource;
    import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

    import java.util.List;

    @Configuration
    public class SecurityConfig {
        @Value("${app.cors.allowed-origins}")
        private String[] allowedOrigins;

        private final JwtAuthenticationFilter jwtFilter;

        public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
            this.jwtFilter = jwtFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    // 🚫 Disable CSRF since we use JWT (stateless)
                    .csrf(csrf -> csrf.disable())
                    // 🌍 Enable CORS
                    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                    // 🛑 Stateless (no session)
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    // 🔒 Define endpoint rules
                    .authorizeHttpRequests(auth -> auth
                            // ===== Public (no JWT needed) =====
                            .requestMatchers("/api/auth/**").permitAll() // OTP login (user)
                            .requestMatchers(
                                    "/api/admin/auth/login",
                                    "/api/admin/auth/forgot-password",
                                    "/api/admin/auth/reset-password"
                            ).permitAll() // Admin login + reset
                            .requestMatchers("/api/products/**").permitAll() // 👈 public product browsing
                            .requestMatchers("/api/categories/**").permitAll() // 👈 if you want public category list

                            // ===== Protected (JWT required) =====
                            .requestMatchers("/api/user/**").hasRole("USER")
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")

                            // ===== Fallback =====
                            .anyRequest().authenticated()
                    )
                    // ➕ Add our JWT filter before UsernamePasswordAuthenticationFilter
                    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration config = new CorsConfiguration();
            // 👉 For dev, allow React frontend; in prod, restrict to your real domain
            config.setAllowedOriginPatterns(List.of(allowedOrigins));
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(List.of("*"));
            config.setAllowCredentials(true);

            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/**", config);
            return source;
        }

        @Bean
        public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
            return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        }
    }
