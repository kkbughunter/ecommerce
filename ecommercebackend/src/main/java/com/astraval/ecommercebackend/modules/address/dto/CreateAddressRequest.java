package com.astraval.ecommercebackend.modules.address.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(
        @NotBlank(message = "Address type is required") @Size(max = 20, message = "Address type must be at most 20 characters") String addressType,
        @NotBlank(message = "Full name is required") @Size(max = 150, message = "Full name must be at most 150 characters") String fullName,
        @Size(max = 20, message = "Phone number must be at most 20 characters") String phoneNumber,
        @NotBlank(message = "Address line1 is required") @Size(max = 255, message = "Address line1 must be at most 255 characters") String line1,
        @Size(max = 255, message = "Address line2 must be at most 255 characters") String line2,
        @Size(max = 150, message = "Landmark must be at most 150 characters") String landmark,
        @NotBlank(message = "City is required") @Size(max = 100, message = "City must be at most 100 characters") String city,
        @Size(max = 100, message = "District must be at most 100 characters") String district,
        @NotBlank(message = "State is required") @Size(max = 100, message = "State must be at most 100 characters") String state,
        @NotBlank(message = "Country is required") @Size(max = 100, message = "Country must be at most 100 characters") String country,
        @NotBlank(message = "Postal code is required") @Size(max = 20, message = "Postal code must be at most 20 characters") String postalCode,
        Boolean isActive) {
}

