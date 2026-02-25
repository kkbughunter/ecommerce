package com.astraval.ecommercebackend.module.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
        @NotBlank String usernameOrEmail,
        @NotBlank String password
) {
}
