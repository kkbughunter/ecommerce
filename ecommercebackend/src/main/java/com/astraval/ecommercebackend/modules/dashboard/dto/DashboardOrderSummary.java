package com.astraval.ecommercebackend.modules.dashboard.dto;

public record DashboardOrderSummary(
        long totalOrders,
        long deliveredOrders,
        long pendingPayments,
        long failedPayments,
        long paidOrders) {
}
