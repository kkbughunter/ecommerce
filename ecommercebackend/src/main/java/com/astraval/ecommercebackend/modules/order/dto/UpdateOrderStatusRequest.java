package com.astraval.ecommercebackend.modules.order.dto;

import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "Order status is required") OrderStatus status,
        PaymentStatus paymentStatus,
        String location,
        String note) {
}
