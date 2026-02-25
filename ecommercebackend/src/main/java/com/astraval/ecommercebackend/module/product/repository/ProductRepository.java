package com.astraval.ecommercebackend.module.product.repository;

import com.astraval.ecommercebackend.module.product.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = {"images", "categories", "inventory"})
    Optional<Product> findBySlug(String slug);

    @EntityGraph(attributePaths = {"images", "categories", "inventory"})
    Optional<Product> findByProductId(UUID productId);
}
