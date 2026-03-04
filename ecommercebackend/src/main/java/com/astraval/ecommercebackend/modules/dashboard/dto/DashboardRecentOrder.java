package com.astraval.ecommercebackend.modules.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;

public record DashboardRecentOrder(
        Long orderId,
        String orderNumber,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal totalAmount,
        String currency,
        LocalDateTime createdDt) {
}
