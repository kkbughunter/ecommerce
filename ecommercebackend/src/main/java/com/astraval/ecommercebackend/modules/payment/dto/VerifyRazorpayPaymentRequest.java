package com.astraval.ecommercebackend.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyRazorpayPaymentRequest(
        @NotNull(message = "orderId is required") Long orderId,
        @NotBlank(message = "razorpayOrderId is required") String razorpayOrderId,
        @NotBlank(message = "razorpayPaymentId is required") String razorpayPaymentId,
        @NotBlank(message = "razorpaySignature is required") String razorpaySignature) {
}
