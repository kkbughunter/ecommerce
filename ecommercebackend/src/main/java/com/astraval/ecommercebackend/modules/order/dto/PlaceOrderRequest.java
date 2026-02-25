package com.astraval.ecommercebackend.modules.order.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;

public record PlaceOrderRequest(
        @NotEmpty(message = "At least one order item is required") List<@Valid PlaceOrderItemRequest> items,
        String shippingAddress,
        String billingAddress,
        String contactPhone,
        @DecimalMin(value = "0.00", message = "Shipping fee cannot be negative") BigDecimal shippingFee,
        @DecimalMin(value = "0.00", message = "Tax amount cannot be negative") BigDecimal taxAmount,
        @DecimalMin(value = "0.00", message = "Discount amount cannot be negative") BigDecimal discountAmount,
        String currency) {
}
