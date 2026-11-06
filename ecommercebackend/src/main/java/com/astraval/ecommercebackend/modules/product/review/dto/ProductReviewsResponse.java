package com.astraval.ecommercebackend.modules.product.review.dto;

import java.util.List;

public record ProductReviewsResponse(
        ProductReviewSummary summary,
        boolean canReview,
        ProductReviewResponse currentUserReview,
        List<ProductReviewResponse> reviews) {
}
