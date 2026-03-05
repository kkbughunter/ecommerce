package com.astraval.ecommercebackend.modules.homeslider.dto;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.homeslider.HomeSliderPlacementTag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateHomeSliderRequest(
        @NotBlank(message = "Title is required") @Size(max = 150, message = "Title must be at most 150 characters") String title,
        @Size(max = 240, message = "Subtitle must be at most 240 characters") String subtitle,
        @Size(max = 1000, message = "Description must be at most 1000 characters") String description,
        @NotBlank(message = "Image URL is required") @Size(max = 1000, message = "Image URL must be at most 1000 characters") String imageUrl,
        @Size(max = 80, message = "CTA label must be at most 80 characters") String ctaLabel,
        @NotBlank(message = "Target URL is required") @Size(max = 1000, message = "Target URL must be at most 1000 characters") String targetUrl,
        @NotNull(message = "Placement tag is required") HomeSliderPlacementTag placementTag,
        @PositiveOrZero(message = "Display order must be non-negative") Integer displayOrder,
        LocalDateTime startDt,
        LocalDateTime endDt,
        Boolean isActive) {
}
