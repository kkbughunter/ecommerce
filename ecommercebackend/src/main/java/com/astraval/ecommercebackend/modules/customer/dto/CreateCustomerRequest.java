package com.astraval.ecommercebackend.modules.customer.dto;

import java.time.LocalDate;

import com.astraval.ecommercebackend.modules.address.dto.AddressUpsertRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotNull(message = "User ID is required") Long userId,
        @NotBlank(message = "First name is required") @Size(max = 100, message = "First name must be at most 100 characters") String firstName,
        @Size(max = 100, message = "Last name must be at most 100 characters") String lastName,
        @Size(max = 20, message = "Gender must be at most 20 characters") String gender,
        LocalDate dateOfBirth,
        @Valid AddressUpsertRequest billingAddress,
        @Valid AddressUpsertRequest shippingAddress,
        Boolean isActive) {
}
