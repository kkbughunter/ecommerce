package com.astraval.ecommercebackend.modules.address.dto;

import java.time.LocalDateTime;

public record AddressResponse(
        Long addressId,
        Long userId,
        String addressType,
        String fullName,
        String phoneNumber,
        String line1,
        String line2,
        String landmark,
        String city,
        String district,
        String state,
        String country,
        String postalCode,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

