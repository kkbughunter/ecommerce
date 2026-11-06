package com.astraval.ecommercebackend.modules.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:products;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
        "spring.jpa.defer-datasource-initialization=false", "r2.enabled=false",
        "jwt.secret=test-secret-key-test-secret-key-123456"
})
@Transactional
class ProductPersistenceTests {
    @Autowired ProductRepository products;
    @Autowired EntityManager entityManager;

    @Test
    void storesLongProductDescriptionsWithoutTruncation() {
        Product product = product();
        String description = "Detailed product specifications. ".repeat(40);
        product.setDescription(description);
        products.saveAndFlush(product);
        entityManager.clear();
        assertThat(products.findById(product.getProductId()).orElseThrow().getDescription())
                .isEqualTo(description);
    }

    @Test
    void listsAndSearchesProductsWithoutACategory() {
        Product product = products.saveAndFlush(product());
        var page = PageRequest.of(0, 20);
        for (String query : new String[] {null, "Uncategorized", "specifications"}) {
            assertThat(products.searchAllProducts(query, page).getContent())
                    .extracting(Product::getProductId).contains(product.getProductId());
            assertThat(products.searchActiveProducts(query, page).getContent())
                    .extracting(Product::getProductId).contains(product.getProductId());
        }
        product.setIsActive(false);
        products.flush();
        assertThat(products.searchActiveProducts(null, page).getContent())
                .extracting(Product::getProductId).doesNotContain(product.getProductId());
    }

    private Product product() {
        Product product = new Product();
        product.setName("Uncategorized product");
        product.setDescription("Product specifications");
        product.setPrice(new BigDecimal("125.50"));
        return product;
    }
}
