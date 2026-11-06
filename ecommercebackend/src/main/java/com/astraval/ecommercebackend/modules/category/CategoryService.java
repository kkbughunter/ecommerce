package com.astraval.ecommercebackend.modules.category;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.upload.SingleImageService;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.modules.category.dto.CategoryResponse;
import com.astraval.ecommercebackend.modules.category.dto.CreateCategoryRequest;

@Service
public class CategoryService {

    private static final Sort CATEGORY_SORT = Sort.by(Sort.Direction.ASC, "categoryName");

    private final CategoryRepository categoryRepository;

    private final ProductRepository products;
    private final SingleImageService images;
    public CategoryService(CategoryRepository categoryRepository, ProductRepository products, SingleImageService images) {
        this.products = products;
        this.images = images;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll(CATEGORY_SORT).stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        return createCategory(request, null);
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request, MultipartFile file) {
        String categoryName = request.categoryName().trim();
        if (categoryRepository.existsByCategoryNameIgnoreCase(categoryName)) {
            throw new BadRequestException("Category name already exists");
        }

        Category category = new Category();
        category.setCategoryName(categoryName);

        if (request.parentCategoryId() != null) {
            Category parentCategory = categoryRepository.findById(request.parentCategoryId())
                    .orElseThrow(() -> new BadRequestException("Parent category not found"));
            category.setParentCategory(parentCategory);
        }

        setImage(category, file);
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, CreateCategoryRequest request, MultipartFile file) {
        Category category = find(id);
        String name = request.categoryName().trim();
        if (categoryRepository.existsByCategoryNameIgnoreCaseAndCategoryIdNot(name, id)) {
            throw new BadRequestException("Category name already exists");
        }
        Category parent = request.parentCategoryId() == null ? null : find(request.parentCategoryId());
        java.util.Set<Integer> visited = new java.util.HashSet<>();
        for (Category ancestor = parent; ancestor != null; ancestor = ancestor.getParentCategory()) {
            if (id.equals(ancestor.getCategoryId()) || !visited.add(ancestor.getCategoryId())) {
                throw new BadRequestException("Category hierarchy cannot contain a cycle");
            }
        }
        category.setCategoryName(name);
        category.setParentCategory(parent);
        setImage(category, file);
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Integer id) {
        Category category = find(id);
        if (products.countByCategoryCategoryId(id) > 0) {
            throw new BadRequestException("Cannot delete a category with assigned products");
        }
        if (categoryRepository.existsByParentCategoryCategoryId(id)) {
            throw new BadRequestException("Cannot delete a category with child categories");
        }
        categoryRepository.delete(category);
        categoryRepository.flush();
        images.deleteAfterCommit(category.getImageObjectKey());
    }

    private Category find(Integer id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private void setImage(Category category, MultipartFile file) {
        if (file == null) return;
        var uploaded = images.upload(file, "category");
        images.deleteAfterCommit(category.getImageObjectKey());
        category.setCategoryImageUrl(uploaded.url());
        category.setImageObjectKey(uploaded.key());
    }

    private CategoryResponse toCategoryResponse(Category category) {
        Category parentCategory = category.getParentCategory();
        long count = products.countByCategoryCategoryId(category.getCategoryId());
        return new CategoryResponse(
                category.getCategoryId(),
                category.getCategoryName(),
                parentCategory != null ? parentCategory.getCategoryId() : null,
                parentCategory != null ? parentCategory.getCategoryName() : null,
                category.getCategoryImageUrl(), count,
                count == 0 && !categoryRepository.existsByParentCategoryCategoryId(category.getCategoryId()));
    }
}
