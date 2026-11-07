package com.astraval.ecommercebackend.modules.product.review;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.product.review.dto.CreateProductReviewRequest;
import com.astraval.ecommercebackend.modules.product.review.dto.ProductReviewResponse;
import com.astraval.ecommercebackend.modules.product.review.dto.ProductReviewsResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ProductReviewController {
    private final ProductReviewService reviews;

    public ProductReviewController(ProductReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ProductReviewsResponse>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponseFactory.ok(reviews.getReviews(productId), "Product reviews fetched successfully"));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<ProductReviewResponse>> saveReview(
            @PathVariable Long productId,
            @Valid @RequestBody CreateProductReviewRequest request) {
        return ResponseEntity.ok(ApiResponseFactory.ok(reviews.saveReview(productId, request), "Product review saved successfully"));
    }
}
