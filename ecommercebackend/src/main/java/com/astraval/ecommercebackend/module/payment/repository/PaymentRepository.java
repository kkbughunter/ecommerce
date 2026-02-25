package com.astraval.ecommercebackend.module.payment.repository;

import com.astraval.ecommercebackend.module.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findTopByOrderOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<Payment> findByProviderPaymentId(String providerPaymentId);
}
