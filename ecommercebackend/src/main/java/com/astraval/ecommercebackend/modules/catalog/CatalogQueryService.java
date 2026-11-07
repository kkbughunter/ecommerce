package com.astraval.ecommercebackend.modules.catalog;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.astraval.ecommercebackend.modules.product.ProductService;
import com.astraval.ecommercebackend.modules.product.dto.*;
import com.astraval.ecommercebackend.modules.category.CategoryService;
import com.astraval.ecommercebackend.modules.category.dto.CategoryResponse;

@Service
public class CatalogQueryService {
    private final ProductService products;
    private final CategoryService categories;
    private final CatalogCache cache;
    public CatalogQueryService(ProductService products, CategoryService categories, CatalogCache cache) {
        this.products = products; this.categories = categories; this.cache = cache;
    }
    public ProductPageResponse activeProducts(int page, int size, String query) {
        return cache.read("active:" + page + ":" + size + ":" + normalized(query), new TypeReference<>() {},
                () -> products.getAllActiveProducts(page, size, query));
    }
    public ProductDetailResponse details(Long id) {
        return cache.read("detail:" + id, new TypeReference<>() {}, () -> products.getProductDetails(id));
    }
    public ProductPageResponse activeCategoryProducts(Integer id, int page, int size, String query) {
        return cache.read("category:" + id + ":" + page + ":" + size + ":" + normalized(query), new TypeReference<>() {},
                () -> products.getActiveProductsByCategory(id, page, size, query));
    }
    public CategoryProductsPageResponse activeCategories(int page, int size, String query) {
        return cache.read("categories-products:" + page + ":" + size + ":" + normalized(query), new TypeReference<>() {},
                () -> products.getActiveCategoriesWithActiveProducts(page, size, query));
    }
    public List<CategoryResponse> categories() {
        return cache.read("categories", new TypeReference<>() {}, categories::getAllCategories);
    }
    private String normalized(String query) { return query == null ? "" : query.trim().toLowerCase(Locale.ROOT); }
}
