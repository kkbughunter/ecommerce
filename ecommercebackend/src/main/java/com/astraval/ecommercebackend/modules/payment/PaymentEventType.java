package com.astraval.ecommercebackend.modules.payment;

public enum PaymentEventType {
    ORDER_CREATED,
    PAYMENT_VERIFIED,
    PAYMENT_FAILED,
    PAYMENT_AUTHORIZED,
    PAYMENT_CAPTURED,
    PAYMENT_REFUNDED,
    WEBHOOK_EVENT
}
