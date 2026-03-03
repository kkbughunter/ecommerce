package com.astraval.ecommercebackend.modules.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long productId,
        String productName,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineSubtotal,
        BigDecimal lineTax,
        BigDecimal lineTotal,
        Integer availableStock,
        Boolean available) {
}
