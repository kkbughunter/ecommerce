package com.astraval.ecommercebackend.modules.product;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.category.Category;
import com.astraval.ecommercebackend.modules.category.CategoryRepository;
import com.astraval.ecommercebackend.modules.product.dto.CategoryProductsPageResponse;
import com.astraval.ecommercebackend.modules.product.dto.CategoryProductsResponse;
import com.astraval.ecommercebackend.modules.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.modules.product.dto.ProductDetailResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductPageResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductResponse;
import com.astraval.ecommercebackend.modules.product.dto.UpdateProductRequest;
import com.astraval.ecommercebackend.modules.upload.UploadService;
import com.astraval.ecommercebackend.modules.upload.dto.UploadResponse;

@Service
public class ProductService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final Sort PRODUCT_SORT = Sort.by(Sort.Direction.DESC, "createdDt");
    private static final Sort CATEGORY_SORT = Sort.by(Sort.Direction.ASC, "categoryName");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SecurityUtil securityUtil;
    private final UploadService uploadService;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SecurityUtil securityUtil,
            UploadService uploadService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.securityUtil = securityUtil;
        this.uploadService = uploadService;
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getAllProducts(int page, int size, String query) {
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Product> productPage = productRepository.searchAllProducts(
                normalizedQuery,
                PageRequest.of(page, size, PRODUCT_SORT));
        return toProductPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getAllActiveProducts(int page, int size, String query) {
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Product> productPage = productRepository.searchActiveProducts(
                normalizedQuery,
                PageRequest.of(page, size, PRODUCT_SORT));
        return toProductPageResponse(productPage);
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Long actorUserId = getCurrentUserId();

        Product product = new Product();
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setGstPercentage(request.gstPercentage());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(resolveCategory(request.categoryId()));
        product.setIsActive(request.isActive() != null ? request.isActive() : true);
        product.setCreatedBy(actorUserId);
        product.setCreatedDt(LocalDateTime.now());


        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, UpdateProductRequest request) {
        Long actorUserId = getCurrentUserId();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setGstPercentage(request.gstPercentage());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(resolveCategory(request.categoryId()));
        product.setModifiedBy(actorUserId);

        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse activateProduct(Long productId) {
        return updateProductStatus(productId, true);
    }

    @Transactional
    public ProductResponse deactivateProduct(Long productId) {
        return updateProductStatus(productId, false);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetails(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toProductDetailResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getProductsByCategory(Integer categoryId, int page, int size, String query) {
        assertCategoryExists(categoryId);
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Product> productPage = productRepository.searchProductsByCategory(
                categoryId,
                normalizedQuery,
                PageRequest.of(page, size, PRODUCT_SORT));
        return toProductPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getActiveProductsByCategory(Integer categoryId, int page, int size, String query) {
        assertCategoryExists(categoryId);
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Product> productPage = productRepository.searchActiveProductsByCategory(
                categoryId,
                normalizedQuery,
                PageRequest.of(page, size, PRODUCT_SORT));
        return toProductPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public CategoryProductsPageResponse getActiveCategoriesWithActiveProducts(int page, int size, String query) {
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Category> categoryPage = categoryRepository.searchActiveCategoriesWithActiveProducts(
                normalizedQuery,
                PageRequest.of(page, size, CATEGORY_SORT));
        return toCategoryProductsPageResponse(categoryPage, normalizedQuery, true);
    }

    @Transactional(readOnly = true)
    public CategoryProductsPageResponse getAllCategoriesWithAllProductsForAdmin(int page, int size, String query) {
        validatePageRequest(page, size);
        String normalizedQuery = normalizeSearchQuery(query);
        Page<Category> categoryPage = categoryRepository.searchAllCategories(
                normalizedQuery,
                PageRequest.of(page, size, CATEGORY_SORT));
        return toCategoryProductsPageResponse(categoryPage, normalizedQuery, false);
    }

    private ProductResponse updateProductStatus(Long productId, boolean active) {
        Long actorUserId = getCurrentUserId();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setIsActive(active);
        product.setModifiedBy(actorUserId);

        return toProductResponse(productRepository.save(product));
    }

    private Category resolveCategory(Integer categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BadRequestException("Category not found"));
    }

    private void assertCategoryExists(Integer categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found");
        }
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Page must be greater than or equal to 0");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Size must be between 1 and " + MAX_PAGE_SIZE);
        }
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid authenticated user identifier");
        }
    }

    private ProductResponse toProductResponse(Product product) {
        Category category = product.getCategory();
        return new ProductResponse(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getGstPercentage(),
                product.getStockQuantity(),
                category != null ? category.getCategoryId() : null,
                category != null ? category.getCategoryName() : null,
                product.getIsActive(),
                product.getCreatedDt(),
                product.getModifiedDt());
    }

    private ProductPageResponse toProductPageResponse(Page<Product> productPage) {
        List<ProductResponse> content = productPage.getContent().stream()
                .map(this::toProductResponse)
                .toList();
        return new ProductPageResponse(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isFirst(),
                productPage.isLast());
    }

    private CategoryProductsPageResponse toCategoryProductsPageResponse(
            Page<Category> categoryPage,
            String query,
            boolean activeOnly) {
        List<Category> categories = categoryPage.getContent();
        if (categories.isEmpty()) {
            return new CategoryProductsPageResponse(
                    List.of(),
                    categoryPage.getNumber(),
                    categoryPage.getSize(),
                    categoryPage.getTotalElements(),
                    categoryPage.getTotalPages(),
                    categoryPage.isFirst(),
                    categoryPage.isLast());
        }

        List<Integer> categoryIds = categories.stream().map(Category::getCategoryId).toList();
        List<Product> products = activeOnly
                ? productRepository.findByCategoryCategoryIdInAndIsActiveTrue(categoryIds)
                : productRepository.findByCategoryCategoryIdIn(categoryIds);

        Map<Integer, List<Product>> allProductsByCategoryId = new HashMap<>();
        Map<Integer, List<Product>> matchedProductsByCategoryId = new HashMap<>();
        for (Product product : products) {
            if (product.getCategory() == null || product.getCategory().getCategoryId() == null) {
                continue;
            }
            Integer categoryId = product.getCategory().getCategoryId();
            allProductsByCategoryId.computeIfAbsent(categoryId, key -> new ArrayList<>()).add(product);
            if (query == null || productMatchesQuery(product, query)) {
                matchedProductsByCategoryId.computeIfAbsent(categoryId, key -> new ArrayList<>()).add(product);
            }
        }

        List<CategoryProductsResponse> content = new ArrayList<>();
        for (Category category : categories) {
            Integer categoryId = category.getCategoryId();
            List<Product> categoryProducts;
            if (query == null || textMatches(category.getCategoryName(), query)) {
                categoryProducts = allProductsByCategoryId.getOrDefault(categoryId, List.of());
            } else {
                categoryProducts = matchedProductsByCategoryId.getOrDefault(categoryId, List.of());
            }

            List<ProductResponse> productResponses = categoryProducts.stream()
                    .map(this::toProductResponse)
                    .toList();
            content.add(new CategoryProductsResponse(
                    categoryId,
                    category.getCategoryName(),
                    productResponses));
        }

        return new CategoryProductsPageResponse(
                content,
                categoryPage.getNumber(),
                categoryPage.getSize(),
                categoryPage.getTotalElements(),
                categoryPage.getTotalPages(),
                categoryPage.isFirst(),
                categoryPage.isLast());
    }

    private String normalizeSearchQuery(String query) {
        if (query == null) {
            return null;
        }
        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean productMatchesQuery(Product product, String query) {
        return textMatches(product.getName(), query) || textMatches(product.getDescription(), query);
    }

    private boolean textMatches(String value, String query) {
        if (value == null || query == null) {
            return false;
        }
        return value.toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT));
    }

    private ProductDetailResponse toProductDetailResponse(Product product) {
        Category category = product.getCategory();
        List<UploadResponse> images = uploadService.getProductImagesByRelatedId(String.valueOf(product.getProductId()));
        return new ProductDetailResponse(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getGstPercentage(),
                product.getStockQuantity(),
                product.getIsActive(),
                category != null ? category.getCategoryId() : null,
                category != null ? category.getCategoryName() : null,
                images,
                product.getCreatedDt(),
                product.getModifiedDt());
    }
}
