package com.astraval.ecommercebackend.modules.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;

public record OrderDetailResponse(
        Long orderId,
        String orderNumber,
        Long userId,
        String userEmail,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal subtotalAmount,
        BigDecimal shippingFee,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String currency,
        String shippingAddress,
        String billingAddress,
        String contactPhone,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt,
        List<OrderItemResponse> items,
        List<OrderTrackingResponse> tracking) {
}
