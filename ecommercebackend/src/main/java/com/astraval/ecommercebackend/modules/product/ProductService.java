package com.astraval.ecommercebackend.modules.product;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.category.Category;
import com.astraval.ecommercebackend.modules.category.CategoryRepository;
import com.astraval.ecommercebackend.modules.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.modules.product.dto.ProductDetailResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductResponse;
import com.astraval.ecommercebackend.modules.product.dto.UpdateProductRequest;

@Service
public class ProductService {

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
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream().map(this::toProductResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findByIsActiveTrue().stream().map(this::toProductResponse).toList();
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Long actorUserId = getCurrentUserId();

        Product product = new Product();
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(resolveCategory(request.categoryId()));
        product.setIsActive(request.isActive() != null ? request.isActive() : true);
        product.setCreatedBy(actorUserId);
        product.setModifiedBy(actorUserId);

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
    public List<ProductResponse> getProductsByCategory(Integer categoryId) {
        assertCategoryExists(categoryId);
        return productRepository.findByCategoryCategoryId(categoryId).stream().map(this::toProductResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProductsByCategory(Integer categoryId) {
        assertCategoryExists(categoryId);
        return productRepository.findByCategoryCategoryIdAndIsActiveTrue(categoryId).stream()
                .map(this::toProductResponse)
                .toList();
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
                product.getStockQuantity(),
                category != null ? category.getCategoryId() : null,
                category != null ? category.getCategoryName() : null,
                product.getIsActive(),
                product.getCreatedDt(),
                product.getModifiedDt());
    }

    private ProductDetailResponse toProductDetailResponse(Product product) {
        Category category = product.getCategory();
        return new ProductDetailResponse(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getIsActive(),
                category != null ? category.getCategoryId() : null,
                category != null ? category.getCategoryName() : null,
                product.getCreatedDt(),
                product.getModifiedDt());
    }
}
