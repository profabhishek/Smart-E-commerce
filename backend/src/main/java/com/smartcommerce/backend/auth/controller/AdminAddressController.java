package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.entity.Address;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.AddressRepository;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users/{userId}/addresses")
public class AdminAddressController {
    private final UserRepository userRepo;
    private final AddressRepository addressRepo;

    public AdminAddressController(UserRepository userRepo, AddressRepository addressRepo) {
        this.userRepo = userRepo;
        this.addressRepo = addressRepo;
    }

    @GetMapping
    public List<Address> getAddresses(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getAddresses();
    }

    @PostMapping
    public Address addAddress(@PathVariable Long userId, @RequestBody Address address) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        address.setUser(user);
        return addressRepo.save(address);
    }

    @PutMapping("/{addressId}")
    public Address updateAddress(@PathVariable Long userId,
                                 @PathVariable Long addressId,
                                 @RequestBody Address updated) {
        Address addr = addressRepo.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        addr.setCountry(updated.getCountry());
        addr.setState(updated.getState());
        addr.setCity(updated.getCity());
        addr.setArea(updated.getArea());
        addr.setHouseNo(updated.getHouseNo());
        addr.setLandmark(updated.getLandmark());
        addr.setPinCode(updated.getPinCode());
        return addressRepo.save(addr);
    }

    @DeleteMapping("/{addressId}")
    public String deleteAddress(@PathVariable Long userId, @PathVariable Long addressId) {
        addressRepo.deleteById(addressId);
        return "Address deleted successfully";
    }
}
