package com.astraval.ecommercebackend.modules.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CreateRazorpayOrderRequest(
        @NotNull(message = "orderId is required") Long orderId) {
}
