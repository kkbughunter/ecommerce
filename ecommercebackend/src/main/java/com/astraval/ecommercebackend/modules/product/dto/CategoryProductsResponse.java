package com.astraval.ecommercebackend.modules.product.dto;

import java.util.List;

public record CategoryProductsResponse(
        Integer categoryId,
        String categoryName,
        List<ProductResponse> products) {
}
