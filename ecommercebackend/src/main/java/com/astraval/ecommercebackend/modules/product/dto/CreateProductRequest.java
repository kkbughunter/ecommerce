package com.astraval.ecommercebackend.modules.product.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @NotBlank(message = "Product name is required") @Size(max = 200, message = "Product name must be at most 200 characters") String name,
        String description,
        @NotNull(message = "Price is required") @DecimalMin(value = "0.00", message = "Price must be non-negative") BigDecimal price,
        @NotNull(message = "Stock quantity is required") @PositiveOrZero(message = "Stock quantity must be non-negative") Integer stockQuantity,
        Integer categoryId,
        Boolean isActive) {
}
