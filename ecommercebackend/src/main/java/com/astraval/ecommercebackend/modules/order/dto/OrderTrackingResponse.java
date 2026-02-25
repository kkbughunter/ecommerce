package com.astraval.ecommercebackend.modules.order.dto;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.order.OrderStatus;

public record OrderTrackingResponse(
        Long trackingEventId,
        OrderStatus status,
        String location,
        String note,
        LocalDateTime eventTime,
        Long createdBy) {
}
