package com.astraval.ecommercebackend.module.payment.dto;

public record RazorpayWebhookResponse(
        String orderNumber,
        String orderStatus,
        String paymentStatus
) {
}
