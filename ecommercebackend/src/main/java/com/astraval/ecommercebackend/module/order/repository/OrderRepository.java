package com.astraval.ecommercebackend.module.order.repository;

import com.astraval.ecommercebackend.module.order.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    boolean existsByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {"items", "items.product", "shippingDetail", "customer"})
    Optional<Order> findByOrderNumber(String orderNumber);
}
