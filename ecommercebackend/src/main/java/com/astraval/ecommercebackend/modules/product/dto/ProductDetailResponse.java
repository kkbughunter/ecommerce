package com.astraval.ecommercebackend.modules.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDetailResponse(
        Long productId,
        String name,
        String description,
        BigDecimal price,
        Integer stockQuantity,
        Boolean isActive,
        Integer categoryId,
        String categoryName,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
