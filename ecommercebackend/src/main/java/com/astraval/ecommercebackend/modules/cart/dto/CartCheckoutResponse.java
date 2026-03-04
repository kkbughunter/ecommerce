package com.astraval.ecommercebackend.modules.cart.dto;

import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;
import com.astraval.ecommercebackend.modules.payment.dto.RazorpayOrderCreateResponse;

public record CartCheckoutResponse(
        OrderDetailResponse order,
        RazorpayOrderCreateResponse payment) {
}
