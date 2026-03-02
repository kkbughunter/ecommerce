package com.astraval.ecommercebackend.modules.order.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;

public record PlaceOrderRequest(
        @NotEmpty(message = "At least one order item is required") List<@Valid PlaceOrderItemRequest> items) {
}
