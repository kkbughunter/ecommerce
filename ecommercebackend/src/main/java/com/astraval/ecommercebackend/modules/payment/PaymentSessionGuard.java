package com.astraval.ecommercebackend.modules.payment;

import java.util.Optional;
import com.astraval.ecommercebackend.common.exception.BadRequestException;

/** Called only while holding the order lock. Keep retries on their original provider session. */
final class PaymentSessionGuard {
    private PaymentSessionGuard() {}
    static Optional<PaymentTransaction> existing(PaymentTransactionRepository repository, Long orderId, PaymentGateway gateway) {
        var attempts = repository.findByOrderOrderIdOrderByCreatedDtDesc(orderId);
        if (attempts.stream().anyMatch(attempt -> attempt.getGateway() != gateway)) {
            throw new BadRequestException("This order already has a payment session with another gateway. Please use the original gateway or contact support.");
        }
        return attempts.stream().findFirst();
    }
}
