package com.astraval.ecommercebackend.modules.product.dto;

import java.math.BigDecimal;

import com.astraval.ecommercebackend.modules.product.ProductTag;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(
        @NotBlank(message = "Product name is required") @Size(max = 200, message = "Product name must be at most 200 characters") String name,
        String description,
        @NotNull(message = "Price is required") @DecimalMin(value = "0.00", message = "Price must be non-negative") BigDecimal price,
        @DecimalMin(value = "0.00", message = "Max price must be non-negative") BigDecimal maxPrice,
        @NotNull(message = "GST percentage is required") @DecimalMin(value = "0.00", message = "GST percentage must be non-negative") @DecimalMax(value = "100.00", message = "GST percentage cannot exceed 100") BigDecimal gstPercentage,
        @NotNull(message = "Stock quantity is required") @PositiveOrZero(message = "Stock quantity must be non-negative") Integer stockQuantity,
        @NotNull(message = "Width is required") @DecimalMin(value = "0.00", message = "Width must be non-negative") BigDecimal widthCm,
        @NotNull(message = "Height is required") @DecimalMin(value = "0.00", message = "Height must be non-negative") BigDecimal heightCm,
        @NotNull(message = "Weight is required") @DecimalMin(value = "0.00", message = "Weight must be non-negative") BigDecimal weightKg,
        @Size(max = 36, message = "Main image upload id must be at most 36 characters") String mainImageUploadId,
        ProductTag productTag,
        Integer categoryId) {
}
