package com.astraval.ecommercebackend.modules.dashboard.dto;

import java.util.List;

public record AdminDashboardResponse(
        DashboardProductSummary productSummary,
        DashboardOrderSummary orderSummary,
        DashboardRevenueSummary revenueSummary,
        List<DashboardGraphPoint> orderTrend,
        List<DashboardGraphPoint> revenueTrend,
        List<DashboardRecentOrder> recentOrders) {
}
