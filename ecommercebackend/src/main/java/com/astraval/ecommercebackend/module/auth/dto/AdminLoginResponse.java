package com.astraval.ecommercebackend.module.auth.dto;

import java.util.UUID;

public record AdminLoginResponse(
        String token,
        UUID adminId,
        String username,
        String email
) {
}
