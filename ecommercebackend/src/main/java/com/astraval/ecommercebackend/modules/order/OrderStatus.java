package com.astraval.ecommercebackend.modules.order;

public enum OrderStatus {
    PLACED,
    CONFIRMED,
    PACKED,
    SHIPPED,
    REFUND_IN_PROCESS,
    REFUNDED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURNED
}
