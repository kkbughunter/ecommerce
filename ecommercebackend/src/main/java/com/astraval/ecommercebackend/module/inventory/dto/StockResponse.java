package com.astraval.ecommercebackend.module.inventory.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StockResponse(
        UUID productId,
        int availableQty,
        int reservedQty,
        int safetyStock,
        OffsetDateTime lastRestockedAt
) {
}
