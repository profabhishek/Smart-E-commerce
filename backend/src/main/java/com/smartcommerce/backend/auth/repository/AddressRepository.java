package com.smartcommerce.backend.auth.repository;

import com.smartcommerce.backend.auth.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserId(Long userId);

    // 🔍 Find existing address for same user (to prevent duplicates)
    @Query("SELECT a FROM Address a WHERE a.user.id = :userId " +
            "AND a.houseNo = :houseNo " +
            "AND a.area = :area " +
            "AND a.city = :city " +
            "AND a.state = :state " +
            "AND a.pinCode = :pinCode " +
            "AND a.country = :country")
    Optional<Address> findExistingAddress(@Param("userId") Long userId,
                                          @Param("houseNo") String houseNo,
                                          @Param("area") String area,
                                          @Param("city") String city,
                                          @Param("state") String state,
                                          @Param("pinCode") String pinCode,
                                          @Param("country") String country);
}
