package com.astraval.ecommercebackend.module.user.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerResponse(
        UUID customerId,
        String email,
        String phone,
        String firstName,
        String lastName,
        boolean active,
        boolean createdByAdmin,
        OffsetDateTime createdAt
) {
}
