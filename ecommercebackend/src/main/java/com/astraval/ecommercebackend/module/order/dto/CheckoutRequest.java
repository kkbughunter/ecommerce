package com.astraval.ecommercebackend.module.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CheckoutRequest(
        @NotNull UUID customerId,
        @NotNull @Size(min = 1) @Valid List<CheckoutItemRequest> items,
        String shippingAddress,
        String billingAddress
) {
}
