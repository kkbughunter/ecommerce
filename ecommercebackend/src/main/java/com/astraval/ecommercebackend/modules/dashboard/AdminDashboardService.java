package com.astraval.ecommercebackend.modules.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.dashboard.dto.AdminDashboardResponse;
import com.astraval.ecommercebackend.modules.dashboard.dto.DashboardGraphPoint;
import com.astraval.ecommercebackend.modules.dashboard.dto.DashboardOrderSummary;
import com.astraval.ecommercebackend.modules.dashboard.dto.DashboardProductSummary;
import com.astraval.ecommercebackend.modules.dashboard.dto.DashboardRecentOrder;
import com.astraval.ecommercebackend.modules.dashboard.dto.DashboardRevenueSummary;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;

@Service
public class AdminDashboardService {

    private static final int TREND_DAYS = 7;
    private static final int RECENT_ORDER_COUNT = 8;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SecurityUtil securityUtil;

    public AdminDashboardService(
            ProductRepository productRepository,
            OrderRepository orderRepository,
            SecurityUtil securityUtil) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        ensureAdmin();

        List<Product> products = productRepository.findAll();
        List<Order> orders = orderRepository.findAll();

        DashboardProductSummary productSummary = buildProductSummary(products);
        DashboardOrderSummary orderSummary = buildOrderSummary(orders);
        DashboardRevenueSummary revenueSummary = buildRevenueSummary(orders);
        List<DashboardGraphPoint> orderTrend = buildOrderTrend(orders);
        List<DashboardGraphPoint> revenueTrend = buildRevenueTrend(orders);
        List<DashboardRecentOrder> recentOrders = buildRecentOrders(orders);

        return new AdminDashboardResponse(
                productSummary,
                orderSummary,
                revenueSummary,
                orderTrend,
                revenueTrend,
                recentOrders);
    }

    private DashboardProductSummary buildProductSummary(List<Product> products) {
        long total = products.size();
        long active = products.stream().filter(product -> Boolean.TRUE.equals(product.getIsActive())).count();
        long inactive = total - active;
        long outOfStock = products.stream().filter(product -> safeStock(product) <= 0).count();
        long lowStock = products.stream().filter(product -> {
            int stock = safeStock(product);
            return stock > 0 && stock <= 5;
        }).count();
        return new DashboardProductSummary(total, active, inactive, lowStock, outOfStock);
    }

    private DashboardOrderSummary buildOrderSummary(List<Order> orders) {
        long total = orders.size();
        long delivered = orders.stream().filter(order -> order.getStatus() == OrderStatus.DELIVERED).count();
        long pendingPayments = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.PENDING).count();
        long failedPayments = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.FAILED).count();
        long paidOrders = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.PAID).count();
        return new DashboardOrderSummary(total, delivered, pendingPayments, failedPayments, paidOrders);
    }

    private DashboardRevenueSummary buildRevenueSummary(List<Order> orders) {
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal paidRevenue = BigDecimal.ZERO;
        long deliveredCount = 0;

        for (Order order : orders) {
            BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(totalAmount);
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                paidRevenue = paidRevenue.add(totalAmount);
            }
            if (order.getStatus() == OrderStatus.DELIVERED) {
                deliveredCount++;
            }
        }

        BigDecimal averageOrderValue = orders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
        double fulfillmentRate = orders.isEmpty()
                ? 0.0
                : (deliveredCount * 100.0) / orders.size();

        return new DashboardRevenueSummary(
                totalRevenue.setScale(2, RoundingMode.HALF_UP),
                paidRevenue.setScale(2, RoundingMode.HALF_UP),
                averageOrderValue.setScale(2, RoundingMode.HALF_UP),
                Math.round(fulfillmentRate * 10.0) / 10.0);
    }

    private List<DashboardGraphPoint> buildOrderTrend(List<Order> orders) {
        LocalDate startDate = LocalDate.now().minusDays(TREND_DAYS - 1L);
        Map<LocalDate, Double> valueByDate = new HashMap<>();
        for (Order order : orders) {
            if (order.getCreatedDt() == null) {
                continue;
            }
            LocalDate orderDate = order.getCreatedDt().toLocalDate();
            if (orderDate.isBefore(startDate)) {
                continue;
            }
            valueByDate.merge(orderDate, 1.0, Double::sum);
        }
        return buildTrendPoints(startDate, valueByDate);
    }

    private List<DashboardGraphPoint> buildRevenueTrend(List<Order> orders) {
        LocalDate startDate = LocalDate.now().minusDays(TREND_DAYS - 1L);
        Map<LocalDate, Double> valueByDate = new HashMap<>();
        for (Order order : orders) {
            if (order.getCreatedDt() == null) {
                continue;
            }
            LocalDate orderDate = order.getCreatedDt().toLocalDate();
            if (orderDate.isBefore(startDate)) {
                continue;
            }
            double amount = order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0;
            valueByDate.merge(orderDate, amount, Double::sum);
        }
        return buildTrendPoints(startDate, valueByDate);
    }

    private List<DashboardGraphPoint> buildTrendPoints(LocalDate startDate, Map<LocalDate, Double> valueByDate) {
        List<DashboardGraphPoint> points = new ArrayList<>();
        for (int dayOffset = 0; dayOffset < TREND_DAYS; dayOffset++) {
            LocalDate date = startDate.plusDays(dayOffset);
            points.add(new DashboardGraphPoint(
                    date.toString(),
                    date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    round2(valueByDate.getOrDefault(date, 0.0))));
        }
        return points;
    }

    private List<DashboardRecentOrder> buildRecentOrders(List<Order> orders) {
        return orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedDt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(RECENT_ORDER_COUNT)
                .map(order -> new DashboardRecentOrder(
                        order.getOrderId(),
                        order.getOrderNumber(),
                        order.getStatus(),
                        order.getPaymentStatus(),
                        order.getTotalAmount(),
                        order.getCurrency(),
                        order.getCreatedDt()))
                .toList();
    }

    private int safeStock(Product product) {
        return product.getStockQuantity() != null ? product.getStockQuantity() : 0;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private void ensureAdmin() {
        if (!securityUtil.hasRole("ADMIN")) {
            throw new UnauthorizedException("Admin role is required");
        }
    }
}
