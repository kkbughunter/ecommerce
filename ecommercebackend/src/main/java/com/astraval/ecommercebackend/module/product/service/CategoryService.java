package com.astraval.ecommercebackend.module.product.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.product.dto.CategoryResponse;
import com.astraval.ecommercebackend.module.product.dto.CreateCategoryRequest;
import com.astraval.ecommercebackend.module.product.entity.Category;
import com.astraval.ecommercebackend.module.product.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request) {
        if (categoryRepository.findBySlug(request.slug()).isPresent()) {
            throw new BadRequestException("Category slug already exists");
        }
        Category category = new Category();
        category.setName(request.name());
        category.setSlug(request.slug());
        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        }
        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getCategoryId(),
                category.getName(),
                category.getSlug(),
                category.getParent() != null ? category.getParent().getCategoryId() : null,
                category.getCreatedAt()
        );
    }
}
