package com.astraval.ecommercebackend.modules.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = { "items", "trackingEvents", "user" })
    List<Order> findByUserUserIdOrderByCreatedDtDesc(Long userId);

    @EntityGraph(attributePaths = { "items", "trackingEvents", "user" })
    Optional<Order> findWithDetailsByOrderId(Long orderId);

    @Override
    @EntityGraph(attributePaths = { "items", "trackingEvents", "user" })
    List<Order> findAll();
}
