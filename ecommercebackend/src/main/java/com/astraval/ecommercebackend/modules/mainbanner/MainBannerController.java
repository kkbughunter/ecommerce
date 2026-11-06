package com.astraval.ecommercebackend.modules.mainbanner;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import com.astraval.ecommercebackend.modules.upload.SingleImageService;

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
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Admin: list all main banners")
    public ResponseEntity<ApiResponse<List<MainBannerResponse>>> getAllMainBannersForAdmin() {
        List<MainBannerResponse> response = mainBannerService.getAllMainBannersForAdmin();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banners fetched successfully"));
    }

    @PostMapping(value = "/admin/main-banners", consumes = "application/json")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Admin: create main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> createMainBanner(
            @Valid @RequestBody CreateMainBannerRequest request) {
        MainBannerResponse response = mainBannerService.createMainBanner(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Main banner created successfully"));
    }

    @PutMapping(value = "/admin/main-banners/{mainBannerId}", consumes = "application/json")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Admin: update main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> updateMainBanner(
            @PathVariable Long mainBannerId,
            @Valid @RequestBody UpdateMainBannerRequest request) {
        MainBannerResponse response = mainBannerService.updateMainBanner(mainBannerId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner updated successfully"));
    }

    @PatchMapping("/admin/main-banners/{mainBannerId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Admin: activate main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> activateMainBanner(@PathVariable Long mainBannerId) {
        MainBannerResponse response = mainBannerService.activateMainBanner(mainBannerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner activated successfully"));
    }

    @PatchMapping("/admin/main-banners/{mainBannerId}/deactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Admin: deactivate main banner")
    public ResponseEntity<ApiResponse<MainBannerResponse>> deactivateMainBanner(@PathVariable Long mainBannerId) {
        MainBannerResponse response = mainBannerService.deactivateMainBanner(mainBannerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Main banner deactivated successfully"));
    }
    @PostMapping(value = "/admin/main-banners", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MainBannerResponse>> createMainBannerWithImage(
            @Valid @RequestPart("request") CreateMainBannerRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            MultipartHttpServletRequest multipart) {
        SingleImageService.validateSingle(multipart);
        var response = mainBannerService.createMainBanner(request, file);
        return ResponseEntity.status(201).body(ApiResponseFactory.ok(response, "Saved successfully"));
    }

    @PutMapping(value = "/admin/main-banners/{mainBannerId}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MainBannerResponse>> updateMainBannerWithImage(
            @PathVariable Long mainBannerId,
            @Valid @RequestPart("request") UpdateMainBannerRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            MultipartHttpServletRequest multipart) {
        SingleImageService.validateSingle(multipart);
        var response = mainBannerService.updateMainBanner(mainBannerId, request, file);
        return ResponseEntity.status(200).body(ApiResponseFactory.ok(response, "Saved successfully"));
    }

    @DeleteMapping("/admin/main-banners/{mainBannerId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMainBanner(@PathVariable Long mainBannerId) {
        mainBannerService.deleteMainBanner(mainBannerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(null, "Deleted successfully"));
    }
}
