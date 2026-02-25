package com.astraval.ecommercebackend.module.product.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID productId,
        String sku,
        String name,
        String slug,
        String shortDescription,
        String description,
        BigDecimal price,
        String currency,
        BigDecimal taxPercent,
        boolean active,
        String meta,
        int availableQty,
        int reservedQty,
        int safetyStock,
        List<String> categories,
        List<ProductImageResponse> images,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
