package com.astraval.ecommercebackend.modules.customer;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByUserUserId(Long userId);

    Optional<Customer> findByUserUserIdAndIsActiveTrue(Long userId);
}

