package com.astraval.ecommercebackend.modules.payment.dto;

import java.time.LocalDateTime;

public record PaymentStatusEventResponse(
        Long paymentStatusTrackingId,
        String previousStatus,
        String newStatus,
        String eventSource,
        String eventType,
        String providerEventId,
        String note,
        LocalDateTime eventTime) {
}
