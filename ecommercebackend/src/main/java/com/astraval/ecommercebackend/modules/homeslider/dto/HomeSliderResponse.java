package com.astraval.ecommercebackend.modules.homeslider.dto;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.homeslider.HomeSliderPlacementTag;

public record HomeSliderResponse(
        Long homeSliderId,
        String title,
        String subtitle,
        String description,
        String imageUrl,
        String ctaLabel,
        String targetUrl,
        HomeSliderPlacementTag placementTag,
        Integer displayOrder,
        LocalDateTime startDt,
        LocalDateTime endDt,
        Boolean isActive,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
