package com.astraval.ecommercebackend.modules.product.review.dto;

public record ProductReviewSummary(
        Double averageRating,
        Long reviewCount,
        Long purchaserCount) {
}
