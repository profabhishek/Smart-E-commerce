# SmartCommerce

A modern e-commerce platform built with Spring Boot and React, featuring secure OTP-based authentication and role-based access control. SmartCommerce provides a seamless shopping experience with separate user and admin interfaces.

## Features

- **OTP-Based Authentication**: Passwordless login system using email OTPs for enhanced security
- **Role-Based Access Control**: Separate authentication flows for users and administrators
- **JWT Security**: Secure token-based authentication with HTTP-only cookies
- **User Profile Management**: Complete profile management with address support
- **Admin Panel**: Dedicated admin interface for platform management
- **Email Integration**: Automated OTP delivery via email with console fallback for development

## Tech Stack

### Backend

- **Spring Boot 3.5.5** - Java framework for building the REST API
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database operations and ORM
- **MySQL** - Primary database
- **JWT (jsonwebtoken)** - Token-based authentication
- **Java Mail** - Email service for OTP delivery

### Frontend

- **React** - User interface library
- **Vite** - Build tool and development server

## Project Requirements

- **Java 24** or higher
- **Maven 3.9.11** or higher
- **Node.js** and **npm** for frontend development
- **MySQL** database server
- **SMTP Email Configuration** (Gmail recommended for production)

## Dependencies

The backend uses several key dependencies managed through Maven:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
</dependencies>
```

## Getting Started

### Environment Setup

1. **Create Environment File**: Create a `.env` file in the backend root directory:

```env
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-secure
```

2. **Configure Database**: Update `application.properties` with your MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartcommerce_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. **Email Configuration** (Optional for development): Configure Gmail SMTP in `application.properties`:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

### Database Setup

Create a MySQL database named `smartcommerce_db`. The application will automatically create the necessary tables on startup using JPA's DDL auto-generation.

## How to Run the Application

### Backend

Navigate to the backend directory and run:

```bash
cd backend
./mvnw spring-boot:run
```

The backend server will start on `http://localhost:8080`.

### Frontend

Navigate to the frontend directory and run:

```bash
cd Frontend/e-commerce-FR
npm install
npm run dev
```

The React development server will start on `http://localhost:5173`.

## Authentication System

### User Authentication Flow

SmartCommerce implements a passwordless authentication system using OTP (One-Time Password):

```java
@PostMapping("/request-otp")
public AuthResponse requestOtp(@RequestBody LoginRequest request) {
    authService.requestOtp(request.getEmail());
    return new AuthResponse("OTP sent", true);
}

@PostMapping("/verify-otp")
public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpRequest request,
                                              HttpServletResponse response) {
    User user = authService.verifyOtp(request.getEmail(), request.getCode());
    String token = authService.generateJwtToken(user);

    ResponseCookie cookie = ResponseCookie.from("jwt", token)
            .httpOnly(true)
            .maxAge(24 * 60 * 60)
            .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    return ResponseEntity.ok(new AuthResponse("Login successful", true, user.getId()));
}
```

### Admin Authentication

Administrators use traditional email/password authentication:

```java
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@RequestBody AdminLoginRequest request,
                                          HttpServletResponse response) {
    User admin = userRepo.findByEmail(request.getEmail()).orElse(null);

    if (admin == null || !"ADMIN".equals(admin.getRole()) ||
        !passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
        return ResponseEntity.status(401)
                .body(new AuthResponse("Invalid admin credentials", false));
    }

    String token = jwtUtils.generateToken(admin.getId(), admin.getRole());
    // Set HTTP-only cookie and return response
}
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/request-otp` - Request OTP for user login
- `POST /api/auth/verify-otp` - Verify OTP and authenticate user
- `POST /api/admin/auth/login` - Admin login with email/password

### User Endpoints (Requires USER role)

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Admin Endpoints (Requires ADMIN role)

- `GET /api/admin/hello` - Test admin access
- `POST /api/admin/create-admin` - Create new admin user

## Security Configuration

The application uses Spring Security with JWT authentication and role-based access control:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/auth/**").permitAll()
            .requestMatchers("/api/user/**").hasRole("USER")
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        );
    return http.build();
}
```

## User Profile Management

Users can manage their profiles including personal information and addresses:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Address {
    private String country;
    private String state;
    private String city;
    private String area;
    private String houseNo;
    private String landmark;
}
```

The profile update endpoint supports partial updates:

```java
@PutMapping("/profile")
public ResponseEntity<AuthResponse> updateProfile(
        @Valid @RequestBody UpdateProfileRequest request,
        Authentication authentication) {
    User loggedInUser = (User) authentication.getPrincipal();
    userService.updateProfile(loggedInUser.getId(), request);
    return ResponseEntity.ok(new AuthResponse("Profile updated successfully", true));
}
```

## Default Admin Account

The application automatically creates a default admin account on startup:

- **Email**: `admin@mysite.com`
- **Password**: `Admin@123`

This is handled by the `AdminSeeder` configuration class which runs on application startup.

## Development Features

### Console OTP Fallback

When email configuration is not available, OTPs are displayed in the console:

```java
public void sendOtpConsole(String toEmail, String code) {
    System.out.println("---- OTP (DEV MODE) ----");
    System.out.println("To: " + toEmail);
    System.out.println("OTP: " + code);
    System.out.println("------------------------");
}
```

### CORS Configuration

The backend is configured to accept requests from the React development server:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowCredentials(true);
    return source;
}
```

## Database Schema

The application uses JPA entities to automatically generate the database schema. Key entities include:

- **User**: Stores user information, authentication details, and embedded address
- **OTP**: Temporary storage for OTP codes with expiration times

## Troubleshooting

### Common Issues

1. **JWT Token Issues**: Ensure the `JWT_SECRET_KEY` environment variable is set and sufficiently long
2. **Database Connection**: Verify MySQL is running and credentials are correct in `application.properties`
3. **Email Service**: OTPs will fall back to console display if email configuration fails
4. **CORS Errors**: Check that the frontend URL matches the CORS configuration

### Development Tips

- Use the console OTP output when email is not configured
- The default admin account is automatically created on first startup
- JWT tokens are stored in HTTP-only cookies for security
- The application uses cookie-based authentication instead of Authorization headers

## Conclusion

SmartCommerce provides a robust foundation for building modern e-commerce applications with security-first design principles. The passwordless authentication system enhances user experience while maintaining security, and the role-based access control ensures proper separation between user and administrative functions.

The modular architecture makes it easy to extend functionality, whether adding new user features, administrative tools, or integrating with external services. The comprehensive security implementation and clean separation of concerns provide a solid foundation for scaling the application.

Ready to start building your e-commerce platform? The development environment setup is straightforward, and the extensive logging helps debug any issues during development. Dive in and start customizing SmartCommerce for your specific needs!
