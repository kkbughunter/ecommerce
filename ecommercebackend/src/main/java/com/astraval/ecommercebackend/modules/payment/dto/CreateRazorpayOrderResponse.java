package com.astraval.ecommercebackend.modules.payment.dto;

import java.math.BigDecimal;

public record CreateRazorpayOrderResponse(
        String razorpayOrderId,
        String razorpayKeyId,
        Long amount,
        String currency,
        Long orderId,
        String orderNumber) {
}
