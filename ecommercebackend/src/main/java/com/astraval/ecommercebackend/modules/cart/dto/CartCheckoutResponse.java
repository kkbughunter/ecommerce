package com.astraval.ecommercebackend.modules.cart.dto;

import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;

public record CartCheckoutResponse(
        OrderDetailResponse order,
        Object payment) {
}
