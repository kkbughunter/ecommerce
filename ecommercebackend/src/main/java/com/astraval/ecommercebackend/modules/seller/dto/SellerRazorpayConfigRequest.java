package com.astraval.ecommercebackend.modules.seller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerRazorpayConfigRequest(

    @NotBlank(message = "Razorpay Key ID is required") @Size(max = 100, message = "Razorpay Key ID must be at most 100 characters") String razorpayKeyId,

    @NotBlank(message = "Razorpay Key Secret is required") @Size(max = 300, message = "Razorpay Key Secret must be at most 300 characters") String razorpayKeySecret,

    @Size(max = 300, message = "Razorpay Webhook Secret must be at most 300 characters") String razorpayWebhookSecret) {
}
