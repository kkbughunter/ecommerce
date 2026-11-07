package com.astraval.ecommercebackend.modules.payment;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@RestController
public class GatewaySettingsController {
    private final GatewaySettingsService service;
    public GatewaySettingsController(GatewaySettingsService service) { this.service = service; }

    @GetMapping("/api/payments/gateways")
    public ApiResponse<List<PaymentGateway>> available() {
        return ApiResponseFactory.ok(service.available(), "Available payment gateways");
    }

    @GetMapping("/api/admin/payment-gateways")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<GatewaySettingsService.GatewayStatus>> list() {
        return ApiResponseFactory.ok(service.list(), "Payment gateway settings");
    }

    public record UpdateGatewayRequest(@NotNull Boolean enabled) {}

    @PutMapping("/api/admin/payment-gateways/{gateway}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<GatewaySettingsService.GatewayStatus> update(@PathVariable PaymentGateway gateway,
            @Valid @RequestBody UpdateGatewayRequest request) {
        return ApiResponseFactory.ok(service.update(gateway, request.enabled()), "Payment gateway updated");
    }
}
