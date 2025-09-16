package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AddressDTO;
import com.smartcommerce.backend.auth.entity.Address;
import com.smartcommerce.backend.auth.service.AddressService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<Address> getAddresses(@RequestParam Long userId) {
        return addressService.getUserAddresses(userId);
    }

    @PostMapping
    public Address addAddress(@RequestParam Long userId, @RequestBody AddressDTO dto) {
        return addressService.addAddress(userId, dto);
    }

    @PutMapping("/{id}")
    public Address updateAddress(@RequestParam Long userId, @PathVariable Long id, @RequestBody AddressDTO dto) {
        return addressService.updateAddress(userId, id, dto);
    }

    @DeleteMapping("/{id}")
    public String deleteAddress(@RequestParam Long userId, @PathVariable Long id) {
        addressService.deleteAddress(userId, id);
        return "Address deleted successfully";
    }
}
