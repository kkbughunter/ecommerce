package com.astraval.ecommercebackend.modules.seller.dto;

import java.time.LocalDateTime;

public record SellerProfileResponse(
        Long sellerProfileId,
        Long userId,
        String businessName,
        String businessEmail,
        String businessPhone,
        boolean isActive,
        LocalDateTime createdDt
) {}
