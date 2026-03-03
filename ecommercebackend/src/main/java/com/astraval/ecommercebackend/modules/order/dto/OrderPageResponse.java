package com.astraval.ecommercebackend.modules.order.dto;

import java.util.List;

public record OrderPageResponse(
        List<OrderSummaryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
}
