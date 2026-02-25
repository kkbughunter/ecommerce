package com.astraval.ecommercebackend.module.cart.repository;

import com.astraval.ecommercebackend.module.cart.entity.Cart;
import com.astraval.ecommercebackend.module.cart.entity.CartStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {

    @EntityGraph(attributePaths = {"items", "items.product", "customer"})
    Optional<Cart> findByCustomerCustomerIdAndStatus(UUID customerId, CartStatus status);

    @EntityGraph(attributePaths = {"items", "items.product", "customer"})
    Optional<Cart> findByCartId(UUID cartId);
}
