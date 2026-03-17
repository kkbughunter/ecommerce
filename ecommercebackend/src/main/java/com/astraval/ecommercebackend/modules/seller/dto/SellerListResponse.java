package com.astraval.ecommercebackend.modules.seller.dto;

import java.time.LocalDateTime;

public record SellerListResponse(
        Long sellerProfileId,
        Long userId,
        String businessName,
        String businessEmail,
        String businessPhone,
        String email,
        boolean isActive,
        LocalDateTime createdDt
) {}
