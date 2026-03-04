package com.astraval.ecommercebackend.modules.dashboard.dto;

import java.math.BigDecimal;

public record DashboardRevenueSummary(
        BigDecimal totalRevenue,
        BigDecimal paidRevenue,
        BigDecimal averageOrderValue,
        double fulfillmentRatePercentage) {
}
