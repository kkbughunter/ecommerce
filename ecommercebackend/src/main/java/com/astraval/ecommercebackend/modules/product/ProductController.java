package com.astraval.ecommercebackend.modules.product;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.modules.product.dto.ProductDetailResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductPageResponse;
import com.astraval.ecommercebackend.modules.product.dto.ProductResponse;
import com.astraval.ecommercebackend.modules.product.dto.UpdateProductRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping
@Tag(name = "Product APIs", description = "Operations related to products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/api/products")
    @Operation(summary = "List all products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductPageResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponseFactory.ok(productService.getAllProducts(page, size), "Products fetched successfully"));
    }

    @GetMapping("/api/products/active")
    @Operation(summary = "List all active products")
    public ResponseEntity<ApiResponse<ProductPageResponse>> getAllActiveProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponseFactory.ok(productService.getAllActiveProducts(page, size), "Active products fetched successfully"));
    }

    @PostMapping("/api/products")
    @Operation(summary = "Create product")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Product created successfully"));
    }

    @PutMapping("/api/products/{productId}")
    @Operation(summary = "Update product details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductRequest request) {
        ProductResponse response = productService.updateProduct(productId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product updated successfully"));
    }

    @PatchMapping("/api/products/{productId}/activate")
    @Operation(summary = "Activate product")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> activateProduct(@PathVariable Long productId) {
        ProductResponse response = productService.activateProduct(productId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product activated successfully"));
    }

    @PatchMapping("/api/products/{productId}/deactivate")
    @Operation(summary = "Deactivate product")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> deactivateProduct(@PathVariable Long productId) {
        ProductResponse response = productService.deactivateProduct(productId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product deactivated successfully"));
    }

    @GetMapping("/api/products/{productId}/details")
    @Operation(summary = "View full product details")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductDetails(@PathVariable Long productId) {
        ProductDetailResponse response = productService.getProductDetails(productId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product details fetched successfully"));
    }

    @GetMapping("/api/products/category/{categoryId}")
    @Operation(summary = "View products by category")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductPageResponse>> getProductsByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ProductPageResponse response = productService.getProductsByCategory(categoryId, page, size);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Category products fetched successfully"));
    }

    @GetMapping("/api/products/category/{categoryId}/active")
    @Operation(summary = "View active products by category")
    public ResponseEntity<ApiResponse<ProductPageResponse>> getActiveProductsByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ProductPageResponse response = productService.getActiveProductsByCategory(categoryId, page, size);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Active category products fetched successfully"));
    }
}
