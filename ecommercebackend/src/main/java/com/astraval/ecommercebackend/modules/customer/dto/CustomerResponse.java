package com.astraval.ecommercebackend.modules.customer.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long customerId,
        Long userId,
        String firstName,
        String lastName,
        String gender,
        LocalDate dateOfBirth,
        Long billingAddressId,
        Long shippingAddressId,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

