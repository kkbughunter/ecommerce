package com.astraval.ecommercebackend.module.product.service;

import com.astraval.ecommercebackend.module.product.entity.Category;
import com.astraval.ecommercebackend.module.product.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CategoryBootstrapService implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public CategoryBootstrapService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }
        create("Electronics", "electronics");
        create("Fashion", "fashion");
        create("Home & Kitchen", "home-kitchen");
    }

    private void create(String name, String slug) {
        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        categoryRepository.save(category);
    }
}
