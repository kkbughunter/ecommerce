package com.astraval.ecommercebackend.modules.customer.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCustomerRequest(
        @NotBlank(message = "First name is required") @Size(max = 100, message = "First name must be at most 100 characters") String firstName,
        @Size(max = 100, message = "Last name must be at most 100 characters") String lastName,
        @Size(max = 20, message = "Gender must be at most 20 characters") String gender,
        LocalDate dateOfBirth,
        Long billingAddressId,
        Long shippingAddressId) {
}

