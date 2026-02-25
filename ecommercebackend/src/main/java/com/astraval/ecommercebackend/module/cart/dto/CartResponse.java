package com.astraval.ecommercebackend.module.cart.dto;

import com.astraval.ecommercebackend.module.cart.entity.CartStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CartResponse(
        UUID cartId,
        UUID customerId,
        CartStatus status,
        BigDecimal totalAmount,
        String currency,
        List<CartItemResponse> items,
        OffsetDateTime updatedAt
) {
}
