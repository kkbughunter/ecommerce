package com.astraval.ecommercebackend.modules.seller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.seller.dto.SellerAdminCreateRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerListResponse;
import com.astraval.ecommercebackend.modules.seller.dto.SellerProfileRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerProfileResponse;
import com.astraval.ecommercebackend.modules.seller.dto.SellerRazorpayConfigRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerRazorpayConfigResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Seller", description = "Seller profile and Razorpay payment gateway configuration")
@RestController
@RequestMapping("/api/seller")
@Validated
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    // -------------------------------------------------------------------------
    // Seller Profile endpoints
    // -------------------------------------------------------------------------

    @Operation(summary = "Super Admin: create a seller profile for a user")
    @PostMapping("/admin/profile")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> createSellerProfile(
            @Valid @RequestBody SellerAdminCreateRequest request) {
        SellerProfileResponse response = sellerService.createSellerProfileForUser(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile created successfully"));
    }

    @Operation(summary = "Update the authenticated seller's profile")
    @PutMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> updateSellerProfile(
            @Valid @RequestBody SellerProfileRequest request) {
        SellerProfileResponse response = sellerService.updateSellerProfile(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile updated successfully"));
    }

    @Operation(summary = "Get the authenticated seller's profile")
    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getMySellerProfile() {
        SellerProfileResponse response = sellerService.getMySellerProfile();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile retrieved"));
    }

    // -------------------------------------------------------------------------
    // Admin endpoints
    // -------------------------------------------------------------------------

    @Operation(summary = "Super Admin: list all seller profiles")
    @GetMapping("/admin/profiles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<SellerListResponse>>> listAllSellers() {
        List<SellerListResponse> response = sellerService.listAllSellers();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profiles fetched"));
    }

    @Operation(summary = "Admin: get any seller profile by id")
    @GetMapping("/admin/profile/{sellerProfileId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getSellerProfileById(
            @PathVariable Long sellerProfileId) {
        SellerProfileResponse response = sellerService.getSellerProfileById(sellerProfileId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile retrieved"));
    }

    @Operation(summary = "Super Admin: save (create or update) Razorpay configuration for a seller")
    @PutMapping("/admin/profile/{sellerProfileId}/razorpay-config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerRazorpayConfigResponse>> saveRazorpayConfigForSeller(
            @PathVariable Long sellerProfileId,
            @Valid @RequestBody SellerRazorpayConfigRequest request) {
        SellerRazorpayConfigResponse response = sellerService.saveRazorpayConfigForSeller(sellerProfileId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Razorpay configuration saved"));
    }

    @Operation(summary = "Super Admin: get Razorpay configuration for a seller (secrets are not returned)")
    @GetMapping("/admin/profile/{sellerProfileId}/razorpay-config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerRazorpayConfigResponse>> getRazorpayConfigForSeller(
            @PathVariable Long sellerProfileId) {
        SellerRazorpayConfigResponse response = sellerService.getRazorpayConfigForSeller(sellerProfileId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Razorpay configuration retrieved"));
    }

    @Operation(summary = "Super Admin: delete Razorpay configuration for a seller")
    @DeleteMapping("/admin/profile/{sellerProfileId}/razorpay-config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRazorpayConfigForSeller(
            @PathVariable Long sellerProfileId) {
        sellerService.deleteRazorpayConfigForSeller(sellerProfileId);
        return ResponseEntity.ok(ApiResponseFactory.deleted("Razorpay configuration deleted"));
    }

    @Operation(summary = "Super Admin: activate seller profile")
    @PatchMapping("/admin/profile/{sellerProfileId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> activateSellerProfile(
            @PathVariable Long sellerProfileId) {
        SellerProfileResponse response = sellerService.activateSellerProfile(sellerProfileId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile activated"));
    }

    @Operation(summary = "Super Admin: deactivate seller profile")
    @PatchMapping("/admin/profile/{sellerProfileId}/deactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> deactivateSellerProfile(
            @PathVariable Long sellerProfileId) {
        SellerProfileResponse response = sellerService.deactivateSellerProfile(sellerProfileId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Seller profile deactivated"));
    }
}
