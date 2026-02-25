package com.astraval.ecommercebackend.module.product.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CategoryResponse(
        UUID categoryId,
        String name,
        String slug,
        UUID parentId,
        OffsetDateTime createdAt
) {
}
