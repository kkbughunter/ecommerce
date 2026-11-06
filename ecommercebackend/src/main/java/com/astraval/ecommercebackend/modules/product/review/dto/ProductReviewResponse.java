package com.astraval.ecommercebackend.modules.product.review.dto;

import java.time.LocalDateTime;

public record ProductReviewResponse(
        Long reviewId,
        Integer rating,
        String title,
        String description,
        String reviewerLabel,
        LocalDateTime createdDt,
        LocalDateTime modifiedDt) {
}
