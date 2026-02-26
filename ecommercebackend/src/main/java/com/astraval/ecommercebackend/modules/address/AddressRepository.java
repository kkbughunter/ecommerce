package com.astraval.ecommercebackend.modules.address;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    List<Address> findByUserUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);

    Optional<Address> findByAddressIdAndUserUserId(Long addressId, Long userId);

    Optional<Address> findByAddressIdAndUserUserIdAndIsActiveTrue(Long addressId, Long userId);
}

