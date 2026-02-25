package com.astraval.ecommercebackend.module.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record RazorpayWebhookRequest(
        @NotBlank String orderNumber,
        String providerPaymentId,
        @NotBlank String status,
        String method,
        String rawPayload
) {
}
