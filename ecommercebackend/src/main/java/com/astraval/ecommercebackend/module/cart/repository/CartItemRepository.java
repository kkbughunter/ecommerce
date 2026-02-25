package com.astraval.ecommercebackend.module.cart.repository;

import com.astraval.ecommercebackend.module.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
}
