package com.astraval.ecommercebackend.modules.seller;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SellerRazorpayConfigRepository extends JpaRepository<SellerRazorpayConfig, Long> {

  Optional<SellerRazorpayConfig> findBySellerProfileSellerProfileId(Long sellerProfileId);

  @Query("SELECT src FROM SellerRazorpayConfig src " +
      "JOIN src.sellerProfile sp " +
      "WHERE sp.user.userId = :userId AND src.isActive = true")
  Optional<SellerRazorpayConfig> findActiveByUserId(@Param("userId") Long userId);
}
