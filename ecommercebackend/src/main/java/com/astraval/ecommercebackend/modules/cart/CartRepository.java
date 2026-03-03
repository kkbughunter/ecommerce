package com.astraval.ecommercebackend.modules.cart;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    @EntityGraph(attributePaths = { "items", "items.product", "user" })
    Optional<Cart> findByUserUserId(Long userId);
}
