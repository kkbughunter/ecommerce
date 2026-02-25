package com.astraval.ecommercebackend.module.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateProductRequest(
        @NotBlank @Size(max = 64) String sku,
        @NotBlank String name,
        @NotBlank String slug,
        @Size(max = 512) String shortDescription,
        String description,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @Size(min = 3, max = 3) String currency,
        @NotNull @DecimalMin("0.00") BigDecimal taxPercent,
        boolean active,
        String meta,
        List<UUID> categoryIds,
        @Valid List<ProductImageRequest> images,
        Integer availableQty,
        Integer safetyStock
) {
}
