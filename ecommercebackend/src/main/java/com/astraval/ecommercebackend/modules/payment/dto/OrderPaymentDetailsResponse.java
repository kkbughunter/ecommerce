package com.astraval.ecommercebackend.modules.payment.dto;

import java.util.List;

import com.astraval.ecommercebackend.modules.order.PaymentStatus;

public record OrderPaymentDetailsResponse(
        Long orderId,
        String orderNumber,
        PaymentStatus orderPaymentStatus,
        List<PaymentAttemptResponse> attempts) {
}
