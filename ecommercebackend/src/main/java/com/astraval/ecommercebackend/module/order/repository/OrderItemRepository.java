package com.astraval.ecommercebackend.module.order.repository;

import com.astraval.ecommercebackend.module.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
}
