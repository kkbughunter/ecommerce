package com.astraval.ecommercebackend.modules.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.astraval.ecommercebackend.modules.upload.dto.UploadResponse;

public record ProductDetailResponse(
        Long productId,
        String name,
        String description,
        BigDecimal price,
        BigDecimal maxPrice,
        BigDecimal gstPercentage,
        Integer stockQuantity,
        String mainImageUploadId,
        Boolean isActive,
        Integer categoryId,
        String categoryName,
        List<UploadResponse> images,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
