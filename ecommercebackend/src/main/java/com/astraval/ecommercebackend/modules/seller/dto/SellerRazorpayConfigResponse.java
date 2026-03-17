package com.astraval.ecommercebackend.modules.seller.dto;

import java.time.LocalDateTime;

public record SellerRazorpayConfigResponse(
    Long sellerRazorpayConfigId,
    Long sellerProfileId,
    String razorpayKeyId,
    boolean isActive,
    LocalDateTime createdDt,
    LocalDateTime modifiedDt) {
}
