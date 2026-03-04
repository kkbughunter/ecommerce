package com.astraval.ecommercebackend.modules.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.dashboard.dto.AdminDashboardResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/admin/dashboard")
@Tag(name = "Admin Dashboard APIs", description = "Admin dashboard metrics and graph data")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    @Operation(summary = "Get admin dashboard summary with graph data")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        AdminDashboardResponse response = adminDashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Admin dashboard fetched successfully"));
    }
}
