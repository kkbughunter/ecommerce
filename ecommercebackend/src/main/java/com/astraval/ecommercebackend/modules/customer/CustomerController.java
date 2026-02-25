package com.astraval.ecommercebackend.modules.customer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.customer.dto.CustomerResponse;
import com.astraval.ecommercebackend.modules.customer.dto.UpdateCustomerRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer APIs", description = "Operations related to customer profile")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }


    @GetMapping("/me")
    @Operation(summary = "Get current user customer profile", description = "Returns the customer profile linked to the authenticated user.")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer() {
        CustomerResponse response = customerService.getCurrentCustomer();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer profile fetched successfully"));
    }

    @GetMapping("/{customerId}")
    @Operation(summary = "Get customer profile by ID", description = "Returns a customer profile by ID, with user-level ownership checks.")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.getCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer fetched successfully"));
    }


    @PutMapping("/me")
    @Operation(summary = "Update current user customer profile", description = "Updates authenticated user's profile and billing/shipping addresses. If addressId is null, a new address is created; otherwise the existing address is updated.")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCurrentCustomer(
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse response = customerService.updateCurrentCustomer(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer profile updated successfully"));
    }

    @PatchMapping("/{customerId}/activate")
    @Operation(summary = "Activate customer profile", description = "Marks a customer profile as active.")
    public ResponseEntity<ApiResponse<CustomerResponse>> activateCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.activateCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer activated successfully"));
    }

    @PatchMapping("/{customerId}/deactivate")
    @Operation(summary = "Deactivate customer profile", description = "Marks a customer profile as inactive.")
    public ResponseEntity<ApiResponse<CustomerResponse>> deactivateCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.deactivateCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer deactivated successfully"));
    }
}
