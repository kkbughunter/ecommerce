package com.astraval.ecommercebackend.modules.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.product.ProductTag;

public record ProductResponse(
        Long productId,
        String name,
        String description,
        BigDecimal price,
        BigDecimal maxPrice,
        BigDecimal gstPercentage,
        Integer stockQuantity,
        String mainImageUploadId,
        ProductTag productTag,
        Integer categoryId,
        String categoryName,
        Boolean isActive,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
