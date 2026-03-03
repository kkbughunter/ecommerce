package com.astraval.ecommercebackend.modules.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.astraval.ecommercebackend.modules.payment.PaymentGateway;
import com.astraval.ecommercebackend.modules.payment.PaymentTransactionStatus;

public record PaymentAttemptResponse(
        Long paymentTransactionId,
        PaymentGateway gateway,
        String razorpayOrderId,
        String razorpayPaymentId,
        PaymentTransactionStatus status,
        BigDecimal amount,
        String currency,
        Integer attemptNumber,
        String method,
        String errorCode,
        String errorDescription,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt,
        List<PaymentStatusEventResponse> events) {
}
