package com.astraval.ecommercebackend.module.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotBlank @Email String email,
        String phone,
        @Size(min = 6, max = 128) String password,
        String firstName,
        String lastName
) {
}
