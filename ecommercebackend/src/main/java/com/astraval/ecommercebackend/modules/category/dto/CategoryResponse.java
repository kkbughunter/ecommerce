package com.astraval.ecommercebackend.modules.category.dto;

public record CategoryResponse(
        Integer categoryId,
        String categoryName,
        Integer parentCategoryId,
        String parentCategoryName) {
}
