package com.astraval.ecommercebackend.modules.mainbanner;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.mainbanner.dto.CreateMainBannerRequest;
import com.astraval.ecommercebackend.modules.mainbanner.dto.MainBannerResponse;
import com.astraval.ecommercebackend.modules.mainbanner.dto.UpdateMainBannerRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Tag(name = "Main Banner APIs", description = "Operations for landing page main banner")
public class MainBannerController {

    private final MainBannerService mainBannerService;

    public MainBannerController(MainBannerService mainBannerService) {
        this.mainBannerService = mainBannerService;
    }

    @GetMapping("/main-banners/active")
    @Operation(summary = "Get active main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> getActiveMainBanner() {
        MainBannerResponse response = mainBannerService.getActiveMainBanner();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Active main banner fetched successfully"));
    }

    @GetMapping("/main-banners/active-list")
    @Operation(summary = "Get active main banner list")
    public ResponseEntity<ApiResponse<List<MainBannerResponse>>> getActiveMainBanners() {
        List<MainBannerResponse> response = mainBannerService.getActiveMainBanners();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Active main banners fetched successfully"));
    }

    @GetMapping("/admin/main-banners")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: list all main banners")
    public ResponseEntity<ApiResponse<List<MainBannerResponse>>> getAllMainBannersForAdmin() {
        List<MainBannerResponse> response = mainBannerService.getAllMainBannersForAdmin();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banners fetched successfully"));
    }

    @PostMapping("/admin/main-banners")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: create main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> createMainBanner(
            @Valid @RequestBody CreateMainBannerRequest request) {
        MainBannerResponse response = mainBannerService.createMainBanner(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Main banner created successfully"));
    }

    @PutMapping("/admin/main-banners/{mainBannerId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: update main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> updateMainBanner(
            @PathVariable Long mainBannerId,
            @Valid @RequestBody UpdateMainBannerRequest request) {
        MainBannerResponse response = mainBannerService.updateMainBanner(mainBannerId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner updated successfully"));
    }

    @PatchMapping("/admin/main-banners/{mainBannerId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: activate main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> activateMainBanner(@PathVariable Long mainBannerId) {
        MainBannerResponse response = mainBannerService.activateMainBanner(mainBannerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner activated successfully"));
    }

    @PatchMapping("/admin/main-banners/{mainBannerId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: deactivate main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> deactivateMainBanner(@PathVariable Long mainBannerId) {
        MainBannerResponse response = mainBannerService.deactivateMainBanner(mainBannerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner deactivated successfully"));
    }
}
