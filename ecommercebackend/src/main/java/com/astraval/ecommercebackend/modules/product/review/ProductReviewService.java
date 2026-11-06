package com.astraval.ecommercebackend.modules.product.review;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.product.review.dto.CreateProductReviewRequest;
import com.astraval.ecommercebackend.modules.product.review.dto.ProductReviewResponse;
import com.astraval.ecommercebackend.modules.product.review.dto.ProductReviewSummary;
import com.astraval.ecommercebackend.modules.product.review.dto.ProductReviewsResponse;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;

@Service
public class ProductReviewService {
    private final ProductReviewRepository reviews;
    private final ProductRepository products;
    private final UserRepository users;
    private final SecurityUtil security;

    public ProductReviewService(ProductReviewRepository reviews, ProductRepository products,
            UserRepository users, SecurityUtil security) {
        this.reviews = reviews;
        this.products = products;
        this.users = users;
        this.security = security;
    }

    @Transactional(readOnly = true)
    public ProductReviewsResponse getReviews(Long productId) {
        requireProduct(productId);
        Long userId = currentUserId();
        ProductReviewSummary summary = getSummaries(List.of(productId)).get(productId);
        ProductReviewResponse current = reviews.findByProductProductIdAndUserUserId(productId, userId)
                .map(this::toResponse).orElse(null);
        boolean canReview = reviews.hasPurchasedProduct(productId, userId, PaymentStatus.PAID);
        List<ProductReviewResponse> items = reviews.findByProductProductIdOrderByCreatedDtDesc(productId).stream()
                .map(this::toResponse).toList();
        return new ProductReviewsResponse(summary, canReview, current, items);
    }

    @Transactional
    public ProductReviewResponse saveReview(Long productId, CreateProductReviewRequest request) {
        Long userId = currentUserId();
        Product product = requireProduct(productId);
        if (!reviews.hasPurchasedProduct(productId, userId, PaymentStatus.PAID)) {
            throw new BadRequestException("Only customers who purchased this product can write a review");
        }
        User user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        ProductReview review = reviews.findByProductProductIdAndUserUserId(productId, userId)
                .orElseGet(ProductReview::new);
        review.setProduct(product);
        review.setUser(user);
        review.setRating(request.rating());
        review.setTitle(request.title().trim());
        review.setDescription(request.description().trim());
        return toResponse(reviews.save(review));
    }

    @Transactional(readOnly = true)
    public Map<Long, ProductReviewSummary> getSummaries(Collection<Long> productIds) {
        Map<Long, ProductReviewSummary> result = new HashMap<>();
        if (productIds == null || productIds.isEmpty()) {
            return result;
        }
        List<Long> ids = new ArrayList<>(productIds);
        for (Long id : ids) {
            result.put(id, new ProductReviewSummary(0.0, 0L, 0L));
        }
        for (Object[] row : reviews.findRatingStatsByProductIds(ids)) {
            Long productId = ((Number) row[0]).longValue();
            double average = ((Number) row[1]).doubleValue();
            long count = ((Number) row[2]).longValue();
            ProductReviewSummary existing = result.get(productId);
            result.put(productId, new ProductReviewSummary(average, count, existing.purchaserCount()));
        }
        for (Object[] row : reviews.findPurchaserCountsByProductIds(ids, PaymentStatus.PAID)) {
            Long productId = ((Number) row[0]).longValue();
            long purchasers = ((Number) row[1]).longValue();
            ProductReviewSummary existing = result.get(productId);
            result.put(productId, new ProductReviewSummary(existing.averageRating(), existing.reviewCount(), purchasers));
        }
        return result;
    }

    private Product requireProduct(Long productId) {
        return products.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private Long currentUserId() {
        try {
            return Long.valueOf(security.getCurrentSub());
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid authenticated user identifier");
        }
    }

    private ProductReviewResponse toResponse(ProductReview review) {
        return new ProductReviewResponse(review.getProductReviewId(), review.getRating(), review.getTitle(),
                review.getDescription(), "Verified purchaser", review.getCreatedDt(), review.getModifiedDt());
    }
}
