package com.astraval.ecommercebackend.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarkPaymentFailedRequest(
        @NotNull(message = "orderId is required") Long orderId,
        @NotBlank(message = "razorpayOrderId is required") String razorpayOrderId,
        String razorpayPaymentId,
        String errorCode,
        String errorDescription) {
}
