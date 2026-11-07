package com.astraval.ecommercebackend.modules.category;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import com.astraval.ecommercebackend.modules.upload.SingleImageService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.category.dto.CategoryResponse;
import com.astraval.ecommercebackend.modules.category.dto.CreateCategoryRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category APIs", description = "Operations related to product categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final com.astraval.ecommercebackend.modules.catalog.CatalogQueryService catalog;

    public CategoryController(CategoryService categoryService, com.astraval.ecommercebackend.modules.catalog.CatalogQueryService catalog) {
        this.catalog = catalog;
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "List all categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> response = catalog.categories();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Categories fetched successfully"));
    }

    @PostMapping(consumes = "application/json")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create category")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Category created successfully"));
    }
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createWithImage(
            @Valid @RequestPart("request") CreateCategoryRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            MultipartHttpServletRequest multipart) {
        SingleImageService.validateSingle(multipart);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(
                categoryService.createCategory(request, file), "Category created successfully"));
    }

    @PutMapping(value = "/{id}", consumes = "application/json")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(@PathVariable Integer id,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponseFactory.ok(categoryService.updateCategory(id, request, null), "Category updated successfully"));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateWithImage(@PathVariable Integer id,
            @Valid @RequestPart("request") CreateCategoryRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            MultipartHttpServletRequest multipart) {
        SingleImageService.validateSingle(multipart);
        return ResponseEntity.ok(ApiResponseFactory.ok(categoryService.updateCategory(id, request, file), "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponseFactory.ok(null, "Category deleted successfully"));
    }
}
