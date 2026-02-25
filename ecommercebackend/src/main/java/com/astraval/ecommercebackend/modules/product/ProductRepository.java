package com.astraval.ecommercebackend.modules.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsActiveTrue();

    List<Product> findByCategoryCategoryId(Integer categoryId);

    List<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId);
}
