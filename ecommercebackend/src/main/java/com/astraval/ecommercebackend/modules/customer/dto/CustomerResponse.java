package com.astraval.ecommercebackend.modules.customer.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.address.dto.AddressResponse;

public record CustomerResponse(
        Long customerId,
        Long userId,
        String firstName,
        String lastName,
        String gender,
        LocalDate dateOfBirth,
        AddressResponse billingAddress,
        AddressResponse shippingAddress,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

