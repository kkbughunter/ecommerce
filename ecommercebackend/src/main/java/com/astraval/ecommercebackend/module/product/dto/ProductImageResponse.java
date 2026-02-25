package com.astraval.ecommercebackend.module.product.dto;

import java.util.UUID;

public record ProductImageResponse(
        UUID imageId,
        String url,
        String altText,
        int position
) {
}
