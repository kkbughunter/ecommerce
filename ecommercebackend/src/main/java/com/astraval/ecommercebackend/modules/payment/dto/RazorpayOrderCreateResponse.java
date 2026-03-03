package com.astraval.ecommercebackend.modules.payment.dto;

import java.time.LocalDateTime;

public record RazorpayOrderCreateResponse(
        Long paymentTransactionId,
        Long orderId,
        String orderNumber,
        String razorpayOrderId,
        String razorpayKeyId,
        String status,
        Long amountInSubunits,
        String currency,
        Integer attemptNumber,
        LocalDateTime createdDt) {
}
