package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.dto.UpdateProfileRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepo){
        this.userRepo = userRepo;
    }

    // Update user profile (Baad me naam daalne ke liye)
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(()-> new RuntimeException("User not found"));

        if(request.getName()    != null) user.setName(request.getName());
        if(request.getPhone()   != null) user.setPhone(request.getPhone());
        if(request.getAddress() != null) user.setAddress(request.getAddress());

        return userRepo.save(user);
    }

    //Get user Profile (Dhundne ke liye Id se)
    public User getProfile(Long userId){
        return userRepo.findById(userId)
                .orElseThrow(()-> new RuntimeException("User not found"));
    }
}
