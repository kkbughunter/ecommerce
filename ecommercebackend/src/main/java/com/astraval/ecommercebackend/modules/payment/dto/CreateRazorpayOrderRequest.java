package com.astraval.ecommercebackend.modules.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CreateRazorpayOrderRequest(
        @NotNull(message = "Order ID is required") Long orderId) {
}
