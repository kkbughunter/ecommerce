package com.astraval.ecommercebackend.modules.cart.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CartResponse(
        Long cartId,
        Long userId,
        String currency,
        BigDecimal subtotalAmount,
        BigDecimal shippingFee,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        Integer totalItems,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt,
        List<CartItemResponse> items) {
}
