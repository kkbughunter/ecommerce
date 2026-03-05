package com.astraval.ecommercebackend.modules.homeslider;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.homeslider.dto.CreateHomeSliderRequest;
import com.astraval.ecommercebackend.modules.homeslider.dto.HomeSliderResponse;
import com.astraval.ecommercebackend.modules.homeslider.dto.UpdateHomeSliderRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Tag(name = "Home Slider APIs", description = "Operations for homepage slider banners")
public class HomeSliderController {

    private final HomeSliderService homeSliderService;

    public HomeSliderController(HomeSliderService homeSliderService) {
        this.homeSliderService = homeSliderService;
    }

    @GetMapping("/home-sliders/active")
    @Operation(summary = "List active home sliders")
    public ResponseEntity<ApiResponse<List<HomeSliderResponse>>> getActiveSliders(
            @RequestParam(required = false) HomeSliderPlacementTag tag) {
        List<HomeSliderResponse> response = homeSliderService.getActiveSliders(tag);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Active sliders fetched successfully"));
    }

    @GetMapping("/admin/home-sliders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: list all home sliders")
    public ResponseEntity<ApiResponse<List<HomeSliderResponse>>> getAllSlidersForAdmin(
            @RequestParam(required = false) HomeSliderPlacementTag tag) {
        List<HomeSliderResponse> response = homeSliderService.getAllSlidersForAdmin(tag);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Sliders fetched successfully"));
    }

    @PostMapping("/admin/home-sliders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: create home slider")
    public ResponseEntity<ApiResponse<HomeSliderResponse>> createSlider(
            @Valid @RequestBody CreateHomeSliderRequest request) {
        HomeSliderResponse response = homeSliderService.createSlider(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Slider created successfully"));
    }

    @PutMapping("/admin/home-sliders/{homeSliderId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: update home slider")
    public ResponseEntity<ApiResponse<HomeSliderResponse>> updateSlider(
            @PathVariable Long homeSliderId,
            @Valid @RequestBody UpdateHomeSliderRequest request) {
        HomeSliderResponse response = homeSliderService.updateSlider(homeSliderId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Slider updated successfully"));
    }

    @PatchMapping("/admin/home-sliders/{homeSliderId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: activate home slider")
    public ResponseEntity<ApiResponse<HomeSliderResponse>> activateSlider(@PathVariable Long homeSliderId) {
        HomeSliderResponse response = homeSliderService.activateSlider(homeSliderId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Slider activated successfully"));
    }

    @PatchMapping("/admin/home-sliders/{homeSliderId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: deactivate home slider")
    public ResponseEntity<ApiResponse<HomeSliderResponse>> deactivateSlider(@PathVariable Long homeSliderId) {
        HomeSliderResponse response = homeSliderService.deactivateSlider(homeSliderId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Slider deactivated successfully"));
    }
}
