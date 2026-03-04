package com.astraval.ecommercebackend.modules.payment;

public enum PaymentTransactionStatus {
    CREATED,
    AUTHORIZED,
    CAPTURED,
    PAID,
    FAILED,
    CANCELLED,
    REFUNDED
}
