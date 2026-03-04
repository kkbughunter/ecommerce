package com.astraval.ecommercebackend.modules.payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByGatewayAndGatewayOrderId(PaymentGateway gateway, String gatewayOrderId);

    Optional<PaymentTransaction> findByGatewayAndGatewayPaymentId(PaymentGateway gateway, String gatewayPaymentId);

    List<PaymentTransaction> findByOrderOrderIdOrderByCreatedDtDesc(Long orderId);

    long countByOrderOrderId(Long orderId);
}
