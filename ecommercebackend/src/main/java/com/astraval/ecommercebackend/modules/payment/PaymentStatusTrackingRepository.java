package com.astraval.ecommercebackend.modules.payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentStatusTrackingRepository extends JpaRepository<PaymentStatusTracking, Long> {

    List<PaymentStatusTracking> findByPaymentTransactionOrderOrderIdOrderByEventTimeAsc(Long orderId);
}
