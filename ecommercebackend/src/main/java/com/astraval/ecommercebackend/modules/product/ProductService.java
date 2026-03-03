package com.astraval.ecommercebackend.modules.product;

import java.time.LocalDateTime;
import java.util.List;

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
import com.astraval.ecommercebackend.modules.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.modules.product.dto.ProductDetailResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductPageResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductResponse;
import com.astraval.ecommercebackend.modules.product.dto.UpdateProductRequest;

@Service
public class ProductService {
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SecurityUtil securityUtil;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SecurityUtil securityUtil) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getAllProducts(int page, int size) {
        validatePageRequest(page, size);
        Page<Product> productPage = productRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDt")));
        return toProductPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getAllActiveProducts(int page, int size) {
        validatePageRequest(page, size);
        Page<Product> productPage = productRepository.findByIsActiveTrue(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDt")));
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
    public ProductPageResponse getProductsByCategory(Integer categoryId, int page, int size) {
        assertCategoryExists(categoryId);
        validatePageRequest(page, size);
        Page<Product> productPage = productRepository.findByCategoryCategoryId(
                categoryId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDt")));
        return toProductPageResponse(productPage);
    }

    @Transactional(readOnly = true)
    public ProductPageResponse getActiveProductsByCategory(Integer categoryId, int page, int size) {
        assertCategoryExists(categoryId);
        validatePageRequest(page, size);
        Page<Product> productPage = productRepository.findByCategoryCategoryIdAndIsActiveTrue(
                categoryId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDt")));
        return toProductPageResponse(productPage);
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

    private ProductDetailResponse toProductDetailResponse(Product product) {
        Category category = product.getCategory();
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
                product.getCreatedDt(),
                product.getModifiedDt());
    }
}
