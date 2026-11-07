package com.astraval.ecommercebackend.modules.reports;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;
import com.astraval.ecommercebackend.modules.product.review.ProductReview;
import com.astraval.ecommercebackend.modules.product.review.ProductReviewRepository;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportsController {
    private final OrderRepository orders;
    private final ProductReviewRepository productReviews;
    private final SecurityUtil security;
    public AdminReportsController(OrderRepository orders, ProductReviewRepository productReviews, SecurityUtil security) {
        this.orders = orders;
        this.productReviews = productReviews;
        this.security = security;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> report(
            @RequestParam(defaultValue = "ONE_YEAR") String range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        if (!security.hasRole("SUPER_ADMIN")) throw new UnauthorizedException("Super admin role is required");
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? switch (range) {
            case "ONE_MONTH" -> end.minusMonths(1).plusDays(1);
            case "THREE_MONTHS" -> end.minusMonths(3).plusDays(1);
            case "SIX_MONTHS" -> end.minusMonths(6).plusDays(1);
            case "ONE_YEAR" -> end.minusYears(1).plusDays(1);
            case "CUSTOM" -> end.minusYears(1).plusDays(1);
            default -> throw new BadRequestException("Unsupported report range");
        } : from;
        if (start.isAfter(end)) throw new BadRequestException("Start date must be before end date");
        List<Order> paid = orders.findAll().stream().filter(o -> o.getCreatedDt() != null && !o.getCreatedDt().toLocalDate().isBefore(start) && !o.getCreatedDt().toLocalDate().isAfter(end) && o.getPaymentStatus() == PaymentStatus.PAID).toList();
        Map<String, BigDecimal> paidByMonth = new LinkedHashMap<>();
        for (Order order : paid) {
            String month = order.getCreatedDt().toLocalDate().withDayOfMonth(1).toString();
            paidByMonth.merge(month, money(order.getTotalAmount()), BigDecimal::add);
        }
        BigDecimal paidTotal = paid.stream().map(Order::getTotalAmount).map(this::money).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal fee = paidTotal.multiply(new BigDecimal("0.02")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gst = fee.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        List<ProductReview> reviews = productReviews.findAll().stream()
                .filter(review -> review.getCreatedDt() != null
                        && !review.getCreatedDt().toLocalDate().isBefore(start)
                        && !review.getCreatedDt().toLocalDate().isAfter(end))
                .toList();
        Map<String, Long> ratingDistribution = new LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) {
            final int value = rating;
            ratingDistribution.put(rating + " stars", reviews.stream()
                    .filter(review -> review.getRating() != null && review.getRating() == value).count());
        }
        Map<String, Long> reviewsByMonth = new LinkedHashMap<>();
        for (ProductReview review : reviews) {
            String month = review.getCreatedDt().toLocalDate().withDayOfMonth(1).toString();
            reviewsByMonth.merge(month, 1L, Long::sum);
        }
        double averageRating = reviews.isEmpty() ? 0.0 : reviews.stream()
                .filter(review -> review.getRating() != null)
                .mapToInt(ProductReview::getRating)
                .average().orElse(0.0);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", start); body.put("to", end); body.put("paidRevenue", paidTotal); body.put("razorpayFee", fee); body.put("razorpayFeeGst", gst); body.put("netInHand", paidTotal.subtract(fee).subtract(gst)); body.put("paidRevenueByMonth", paidByMonth);
        body.put("totalProductReviews", reviews.size());
        body.put("averageProductRating", BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP));
        body.put("ratingDistribution", ratingDistribution);
        body.put("reviewsByMonth", reviewsByMonth);
        body.put("unavailableReports", List.of("Discount & Coupon Performance", "Cohort Retention", "RFM Segmentation", "Cart Abandonment", "Fulfillment Cycle Time"));
        return ResponseEntity.ok(ApiResponseFactory.ok(body, "Reports fetched successfully"));
    }
    private BigDecimal money(BigDecimal amount) { return amount == null ? BigDecimal.ZERO : amount; }
}
