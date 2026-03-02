package com.astraval.ecommercebackend.modules.customer.dto;

import java.time.LocalDateTime;

public record CustomerListResponse(
        Long customerId,
        Long userId,
        String firstName,
        String lastName,
        String email,
        Boolean isActive,
        LocalDateTime createdAt) {
}
