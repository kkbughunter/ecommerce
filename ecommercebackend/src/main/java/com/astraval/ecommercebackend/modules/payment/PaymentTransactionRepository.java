package com.astraval.ecommercebackend.modules.payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    @org.springframework.data.jpa.repository.Query("select p.order.orderId from PaymentTransaction p where p.gateway = :gateway and p.gatewayOrderId = :id")
    Optional<Long> findOrderIdForGateway(@org.springframework.data.repository.query.Param("gateway") PaymentGateway gateway,
            @org.springframework.data.repository.query.Param("id") String id);

    Optional<PaymentTransaction> findByGatewayAndGatewayOrderId(PaymentGateway gateway, String gatewayOrderId);

    Optional<PaymentTransaction> findByGatewayAndGatewayPaymentId(PaymentGateway gateway, String gatewayPaymentId);

    List<PaymentTransaction> findByOrderOrderIdOrderByCreatedDtDesc(Long orderId);

    long countByOrderOrderId(Long orderId);
}
