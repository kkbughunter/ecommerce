package com.astraval.ecommercebackend.modules.mainbanner.dto;

import java.time.LocalDateTime;

public record MainBannerResponse(
        Long mainBannerId,
        String headline,
        String subheadline,
        String description,
        String imageUrl,
        String primaryCtaLabel,
        String primaryCtaUrl,
        String secondaryCtaLabel,
        String secondaryCtaUrl,
        String badgeText,
        Integer displayOrder,
        LocalDateTime startDt,
        LocalDateTime endDt,
        Boolean isActive,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
