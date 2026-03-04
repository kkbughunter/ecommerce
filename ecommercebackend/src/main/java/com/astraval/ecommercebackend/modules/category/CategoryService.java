package com.astraval.ecommercebackend.modules.category;

import java.util.List;

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

    public CategoryService(CategoryRepository categoryRepository) {
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

        return toCategoryResponse(categoryRepository.save(category));
    }

    private CategoryResponse toCategoryResponse(Category category) {
        Category parentCategory = category.getParentCategory();
        return new CategoryResponse(
                category.getCategoryId(),
                category.getCategoryName(),
                parentCategory != null ? parentCategory.getCategoryId() : null,
                parentCategory != null ? parentCategory.getCategoryName() : null);
    }
}
