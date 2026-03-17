package com.astraval.ecommercebackend.modules.seller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerProfileRequest(

        @NotBlank(message = "Business name is required")
        @Size(max = 200, message = "Business name must be at most 200 characters")
        String businessName,

        @Email(message = "Business email must be valid")
        @Size(max = 100)
        String businessEmail,

        @Size(max = 20)
        String businessPhone
) {}
