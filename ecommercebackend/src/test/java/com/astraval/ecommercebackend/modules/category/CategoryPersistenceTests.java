package com.astraval.ecommercebackend.modules.category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.category.dto.CreateCategoryRequest;
import com.astraval.ecommercebackend.common.exception.BadRequestException;
@SpringBootTest(properties = {
 "spring.datasource.url=jdbc:h2:mem:category-management;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
 "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
 "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
 "spring.jpa.defer-datasource-initialization=false", "r2.enabled=false",
 "jwt.secret=test-secret-key-test-secret-key-123456"
})
@Transactional
class CategoryPersistenceTests {
 @Autowired CategoryService service;
 @Autowired CategoryRepository categories;
 @Autowired ProductRepository products;
 @Test void countsInactiveProductsAndPreventsDeletingTheirCategory() {
  var created=service.createCategory(new CreateCategoryRequest("Assigned",null));
  var category=categories.findById(created.categoryId()).orElseThrow();
  category.setCategoryImageUrl("https://cdn.example/category.webp");
  Product product=new Product(); product.setName("Hidden product"); product.setPrice(java.math.BigDecimal.ONE);
  product.setCategory(category); product.setIsActive(false); products.saveAndFlush(product);
  var response=service.getAllCategories().stream().filter(c -> c.categoryId().equals(created.categoryId())).findFirst().orElseThrow();
  assertThat(response.productCount()).isEqualTo(1);
  assertThat(response.canDelete()).isFalse();
  assertThat(response.categoryImageUrl()).isEqualTo("https://cdn.example/category.webp");
  assertThatThrownBy(()->service.deleteCategory(created.categoryId())).isInstanceOf(BadRequestException.class);
 }
 @Test void updatesNamesPreservesImageAndDeletesUnassignedCategory() {
  var created=service.createCategory(new CreateCategoryRequest("Empty",null));
  var category=categories.findById(created.categoryId()).orElseThrow();
  category.setCategoryImageUrl("https://cdn.example/category.webp");
  var updated=service.updateCategory(created.categoryId(),new CreateCategoryRequest("Renamed",null),null);
  assertThat(updated.categoryName()).isEqualTo("Renamed");
  assertThat(updated.categoryImageUrl()).isEqualTo("https://cdn.example/category.webp");
  assertThat(updated.canDelete()).isTrue();
  service.deleteCategory(created.categoryId());
  assertThat(categories.findById(created.categoryId())).isEmpty();
 }
 @Test void cannotReparentCategoryBeneathItsDescendant() {
  var parent=service.createCategory(new CreateCategoryRequest("Parent",null));
  var child=service.createCategory(new CreateCategoryRequest("Child",parent.categoryId()));
  assertThatThrownBy(()->service.updateCategory(parent.categoryId(),new CreateCategoryRequest("Parent",child.categoryId()),null))
   .isInstanceOf(BadRequestException.class);
 }
}
