package com.astraval.ecommercebackend.modules.payment.dto;

public record VerifyPaymentResponse(
        boolean success,
        String message,
        String note) {
}
