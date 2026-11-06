package com.astraval.ecommercebackend.modules.product.review;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductProductIdOrderByCreatedDtDesc(Long productId);

    Optional<ProductReview> findByProductProductIdAndUserUserId(Long productId, Long userId);

    @Query("""
            select r.product.productId, avg(r.rating), count(r)
            from ProductReview r
            where r.product.productId in :productIds
            group by r.product.productId
            """)
    List<Object[]> findRatingStatsByProductIds(@Param("productIds") Collection<Long> productIds);

    @Query("""
            select oi.product.productId, count(distinct o.user.userId)
            from OrderItem oi join oi.order o
            where oi.product.productId in :productIds and o.paymentStatus = :paymentStatus
            group by oi.product.productId
            """)
    List<Object[]> findPurchaserCountsByProductIds(
            @Param("productIds") Collection<Long> productIds,
            @Param("paymentStatus") com.astraval.ecommercebackend.modules.order.PaymentStatus paymentStatus);

    @Query("""
            select count(oi) > 0
            from OrderItem oi join oi.order o
            where oi.product.productId = :productId
              and o.user.userId = :userId
              and o.paymentStatus = :paymentStatus
            """)
    boolean hasPurchasedProduct(
            @Param("productId") Long productId,
            @Param("userId") Long userId,
            @Param("paymentStatus") com.astraval.ecommercebackend.modules.order.PaymentStatus paymentStatus);
}
