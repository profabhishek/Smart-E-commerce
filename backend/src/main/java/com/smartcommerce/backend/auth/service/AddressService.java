package com.smartcommerce.backend.auth.service;

import com.smartcommerce.backend.auth.dto.AddressDTO;
import com.smartcommerce.backend.auth.entity.Address;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.repository.AddressRepository;
import com.smartcommerce.backend.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    // Get all addresses for a user
    public List<Address> getUserAddresses(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    // Add a new address
    public Address addAddress(Long userId, AddressDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = new Address();
        mapDtoToEntity(dto, address);
        address.setUser(user);

        return addressRepository.save(address);
    }

    // Update existing address
    public Address updateAddress(Long userId, Long addressId, AddressDTO dto) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this address");
        }

        mapDtoToEntity(dto, address);
        return addressRepository.save(address);
    }

    // Delete address
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this address");
        }

        addressRepository.delete(address);
    }

    private void mapDtoToEntity(AddressDTO dto, Address address) {
        address.setHouseNo(dto.getHouseNo());
        address.setArea(dto.getArea());
        address.setLandmark(dto.getLandmark());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setCountry(dto.getCountry());
        address.setPinCode(dto.getPinCode());
    }
}
