package com.astraval.ecommercebackend.modules.product.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProductReviewRequest(
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        Integer rating,
        @NotBlank(message = "Review title is required")
        @Size(max = 120, message = "Review title must not exceed 120 characters")
        String title,
        @NotBlank(message = "Review description is required")
        @Size(max = 2000, message = "Review description must not exceed 2000 characters")
        String description) {
}
