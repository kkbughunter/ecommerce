package com.astraval.ecommercebackend.modules.customer;

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
import com.astraval.ecommercebackend.modules.customer.dto.CreateCustomerRequest;
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

    @PostMapping
    @Operation(summary = "Create customer profile")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Customer created successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user customer profile")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer() {
        CustomerResponse response = customerService.getCurrentCustomer();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer profile fetched successfully"));
    }

    @GetMapping("/{customerId}")
    @Operation(summary = "Get customer profile by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.getCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer fetched successfully"));
    }

    @PutMapping("/{customerId}")
    @Operation(summary = "Update customer profile")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long customerId,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(customerId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer updated successfully"));
    }

    @PatchMapping("/{customerId}/activate")
    @Operation(summary = "Activate customer profile")
    public ResponseEntity<ApiResponse<CustomerResponse>> activateCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.activateCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer activated successfully"));
    }

    @PatchMapping("/{customerId}/deactivate")
    @Operation(summary = "Deactivate customer profile")
    public ResponseEntity<ApiResponse<CustomerResponse>> deactivateCustomer(@PathVariable Long customerId) {
        CustomerResponse response = customerService.deactivateCustomer(customerId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Customer deactivated successfully"));
    }
}

