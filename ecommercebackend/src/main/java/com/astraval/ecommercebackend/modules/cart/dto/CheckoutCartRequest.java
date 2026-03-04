package com.astraval.ecommercebackend.modules.cart.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CheckoutCartRequest(
        @NotEmpty(message = "At least one cart item must be selected for checkout") List<@NotNull(message = "Product id is required") Long> productIds) {
}
