package com.astraval.ecommercebackend.modules.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Order o where o.orderId = :id")
    Optional<Order> findForPaymentUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    @EntityGraph(attributePaths = { "user" })
    List<Order> findByUserUserIdOrderByCreatedDtDesc(Long userId);

    @EntityGraph(attributePaths = { "items", "user" })
    Optional<Order> findWithDetailsByOrderId(Long orderId);

    @Override
    @EntityGraph(attributePaths = { "user" })
    List<Order> findAll();
}
