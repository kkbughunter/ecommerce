package com.astraval.ecommercebackend.modules.auth.dto;

import java.util.List;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        long refreshExpiresInSeconds,
        List<String> roles) {
}
