package com.astraval.ecommercebackend.modules.dashboard.dto;

public record DashboardProductSummary(
        long totalProducts,
        long activeProducts,
        long inactiveProducts,
        long lowStockProducts,
        long outOfStockProducts) {
}
