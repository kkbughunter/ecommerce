package com.astraval.ecommercebackend.module.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 128) String name,
        @NotBlank @Size(max = 160) String slug,
        UUID parentId
) {
}
