package com.astraval.ecommercebackend.modules.payment;

public enum PaymentTransactionStatus {
    CREATED,
    SUCCESS,
    AUTHORIZED,
    CAPTURED,
    PAID,
    FAILED,
    CANCELLED,
    REFUNDED
}
