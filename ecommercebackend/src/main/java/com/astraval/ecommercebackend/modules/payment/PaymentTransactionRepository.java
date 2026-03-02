package com.astraval.ecommercebackend.modules.payment;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByRazorpayOrderId(String razorpayOrderId);

    Optional<PaymentTransaction> findByRazorpayPaymentId(String razorpayPaymentId);

    boolean existsByRazorpayPaymentIdAndStatus(String razorpayPaymentId, PaymentStatus status);

    Optional<PaymentTransaction> findByOrderOrderId(Long orderId);
}
