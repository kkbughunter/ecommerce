package com.astraval.ecommercebackend.module.product.dto;

import jakarta.validation.constraints.NotBlank;

public record ProductImageRequest(
        @NotBlank String url,
        String altText,
        Integer position
) {
}
