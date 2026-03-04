package com.astraval.ecommercebackend.modules.category;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Optional<Category> findByCategoryName(String categoryName);
    boolean existsByCategoryNameIgnoreCase(String categoryName);

    @Query("""
            select c from Category c
            where exists (
                    select 1 from Product p
                    where p.category = c
                      and p.isActive = true
                  )
              and (
                    coalesce(:q, '') = ''
                    or lower(c.categoryName) like lower(concat('%', :q, '%'))
                    or exists (
                        select 1 from Product p
                        where p.category = c
                          and p.isActive = true
                          and (
                                lower(p.name) like lower(concat('%', :q, '%'))
                                or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                              )
                      )
                  )
            """)
    Page<Category> searchActiveCategoriesWithActiveProducts(@Param("q") String q, Pageable pageable);

    @Query("""
            select c from Category c
            where (
                    coalesce(:q, '') = ''
                    or lower(c.categoryName) like lower(concat('%', :q, '%'))
                    or exists (
                        select 1 from Product p
                        where p.category = c
                          and (
                                lower(p.name) like lower(concat('%', :q, '%'))
                                or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                              )
                      )
                  )
            """)
    Page<Category> searchAllCategories(@Param("q") String q, Pageable pageable);
}
