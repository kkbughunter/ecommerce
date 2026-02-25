package com.astraval.ecommercebackend.module.order.dto;

import com.astraval.ecommercebackend.module.order.entity.OrderPaymentStatus;
import com.astraval.ecommercebackend.module.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID orderId,
        String orderNumber,
        UUID customerId,
        OrderStatus status,
        OrderPaymentStatus paymentStatus,
        BigDecimal subtotalAmount,
        BigDecimal taxAmount,
        BigDecimal shippingAmount,
        BigDecimal totalAmount,
        String currency,
        String shippingAddress,
        String billingAddress,
        List<OrderItemResponse> items,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
