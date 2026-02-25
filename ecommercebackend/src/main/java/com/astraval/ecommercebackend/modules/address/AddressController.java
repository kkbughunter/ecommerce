package com.astraval.ecommercebackend.modules.address;

import java.util.List;

import org.springframework.http.ResponseEntity;
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
import com.astraval.ecommercebackend.modules.address.dto.AddressResponse;
import com.astraval.ecommercebackend.modules.address.dto.CreateAddressRequest;
import com.astraval.ecommercebackend.modules.address.dto.UpdateAddressRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/addresses")
@Tag(name = "Address APIs", description = "Operations related to user addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    @Operation(summary = "List all addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses() {
        return ResponseEntity.ok(ApiResponseFactory.ok(addressService.getMyAddresses(), "Addresses fetched successfully"));
    }

    @GetMapping("/active")
    @Operation(summary = "List active addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyActiveAddresses() {
        return ResponseEntity.ok(
                ApiResponseFactory.ok(addressService.getMyActiveAddresses(), "Active addresses fetched successfully"));
    }

    @GetMapping("/{addressId}")
    @Operation(summary = "Get a specific address for current user")
    public ResponseEntity<ApiResponse<AddressResponse>> getMyAddress(@PathVariable Long addressId) {
        AddressResponse response = addressService.getMyAddress(addressId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Address fetched successfully"));
    }

    @PostMapping
    @Operation(summary = "Create address for current user")
    public ResponseEntity<ApiResponse<AddressResponse>> createMyAddress(
            @Valid @RequestBody CreateAddressRequest request) {
        AddressResponse response = addressService.createMyAddress(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Address created successfully"));
    }

    @PutMapping("/{addressId}")
    @Operation(summary = "Update address for current user")
    public ResponseEntity<ApiResponse<AddressResponse>> updateMyAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody UpdateAddressRequest request) {
        AddressResponse response = addressService.updateMyAddress(addressId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Address updated successfully"));
    }

    @PatchMapping("/{addressId}/activate")
    @Operation(summary = "Activate address for current user")
    public ResponseEntity<ApiResponse<AddressResponse>> activateMyAddress(@PathVariable Long addressId) {
        AddressResponse response = addressService.activateMyAddress(addressId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Address activated successfully"));
    }

    @PatchMapping("/{addressId}/deactivate")
    @Operation(summary = "Deactivate address for current user")
    public ResponseEntity<ApiResponse<AddressResponse>> deactivateMyAddress(@PathVariable Long addressId) {
        AddressResponse response = addressService.deactivateMyAddress(addressId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Address deactivated successfully"));
    }
}

