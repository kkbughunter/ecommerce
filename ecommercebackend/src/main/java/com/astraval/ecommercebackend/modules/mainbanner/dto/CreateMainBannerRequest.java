package com.astraval.ecommercebackend.modules.mainbanner.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateMainBannerRequest(
        @NotBlank(message = "Headline is required") @Size(max = 180, message = "Headline must be at most 180 characters") String headline,
        @Size(max = 240, message = "Subheadline must be at most 240 characters") String subheadline,
        @Size(max = 1200, message = "Description must be at most 1200 characters") String description,
        @Size(max = 1000, message = "Image URL must be at most 1000 characters") String imageUrl,
        @Size(max = 80, message = "Primary CTA label must be at most 80 characters") String primaryCtaLabel,
        @Size(max = 1000, message = "Primary CTA URL must be at most 1000 characters") String primaryCtaUrl,
        @Size(max = 80, message = "Secondary CTA label must be at most 80 characters") String secondaryCtaLabel,
        @Size(max = 1000, message = "Secondary CTA URL must be at most 1000 characters") String secondaryCtaUrl,
        @Size(max = 120, message = "Badge text must be at most 120 characters") String badgeText,
        @PositiveOrZero(message = "Display order must be non-negative") Integer displayOrder,
        LocalDateTime startDt,
        LocalDateTime endDt,
        Boolean isActive) {
}
