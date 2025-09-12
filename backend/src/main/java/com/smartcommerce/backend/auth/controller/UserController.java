package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.UpdateProfileRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ✅ Get logged-in user's profile
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        User loggedInUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getProfile(loggedInUser.getId()));
    }

    // ✅ Update logged-in user's profile
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {

        User loggedInUser = (User) authentication.getPrincipal();
        userService.updateProfile(loggedInUser.getId(), request);

        // Build response with userId (no new token here)
        AuthResponse res = new AuthResponse();
        res.setMessage("Profile updated successfully");
        res.setSuccess(true);
        res.setUserId(loggedInUser.getId()); // we aren't rotating tokens on profile update

        return ResponseEntity.ok(res);
    }
}
