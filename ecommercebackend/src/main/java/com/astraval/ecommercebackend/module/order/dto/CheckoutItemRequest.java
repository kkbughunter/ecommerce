package com.astraval.ecommercebackend.module.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CheckoutItemRequest(
        @NotNull UUID productId,
        @NotNull @Min(1) Integer quantity
) {
}
