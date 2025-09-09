package com.smartcommerce.backend.auth.controller;


import com.smartcommerce.backend.auth.dto.AuthResponse;
import com.smartcommerce.backend.auth.dto.UpdateProfileRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Update user profile (Api bnegi idhr)
    @PutMapping("/update-profile/{userId}")
    public AuthResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(userId, request);
        return new AuthResponse("Profile Updated successfully" , true);
    }

    //Get User profile
    @GetMapping("/profile/{userId}")
    public User getProfile(@PathVariable Long userId){
        return userService.getProfile(userId);
    }
}
