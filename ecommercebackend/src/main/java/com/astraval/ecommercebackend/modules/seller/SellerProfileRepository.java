package com.astraval.ecommercebackend.modules.seller;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {

    Optional<SellerProfile> findByUserUserId(Long userId);

    boolean existsByUserUserId(Long userId);
}
