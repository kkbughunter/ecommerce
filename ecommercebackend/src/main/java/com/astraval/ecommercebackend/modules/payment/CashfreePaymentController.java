package com.astraval.ecommercebackend.modules.payment;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import com.astraval.ecommercebackend.common.util.*;

@RestController
@RequestMapping("/api/payments/cashfree")
public class CashfreePaymentController {
    private final CashfreePaymentService service;
    public CashfreePaymentController(CashfreePaymentService service) { this.service = service; }
    public record CreateRequest(@NotNull @Positive Long orderId) {}
    public record VerifyRequest(@NotNull @Positive Long orderId, @NotBlank String gatewayOrderId) {}

    @PostMapping("/order")
    public ApiResponse<CashfreePaymentService.CashfreeOrderResponse> create(@Valid @RequestBody CreateRequest request) {
        return ApiResponseFactory.ok(service.create(request.orderId()), "Cashfree payment session created");
    }
    @PostMapping("/verify")
    public ApiResponse<CashfreePaymentService.VerificationResponse> verify(@Valid @RequestBody VerifyRequest request) {
        return ApiResponseFactory.ok(service.verify(request.orderId(), request.gatewayOrderId()), "Payment status checked");
    }
    @PostMapping("/webhook")
    public ApiResponse<CashfreePaymentService.VerificationResponse> webhook(
            @RequestHeader(name = "x-webhook-signature", required = false) String signature,
            @RequestHeader(name = "x-webhook-timestamp", required = false) String timestamp,
            @RequestBody String payload) {
        return ApiResponseFactory.ok(service.webhook(signature, timestamp, payload), "Webhook processed");
    }
}
