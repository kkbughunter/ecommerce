package com.astraval.ecommercebackend.module.order.dto;

import com.astraval.ecommercebackend.module.order.entity.OrderPaymentStatus;
import com.astraval.ecommercebackend.module.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record CheckoutResponse(
        UUID orderId,
        String orderNumber,
        OrderStatus status,
        OrderPaymentStatus paymentStatus,
        BigDecimal totalAmount,
        String currency,
        UUID paymentId
) {
}
