package com.astraval.ecommercebackend.modules.category;

import java.util.Arrays;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CategoryInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public CategoryInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Categories already exist, skipping initialization");
            return;
        }

        List<String> defaultCategories = Arrays.asList(
                "Electronics",
                "Fashion",
                "Home & Kitchen",
                "Books",
                "Sports & Outdoors",
                "Beauty & Personal Care",
                "Toys & Games",
                "Health & Wellness"
        );

        defaultCategories.forEach(name -> {
            Category category = new Category();
            category.setCategoryName(name);
            categoryRepository.save(category);
        });

        log.info("Initialized {} default categories", defaultCategories.size());
    }
}
