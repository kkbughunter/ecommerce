package com.astraval.ecommercebackend.modules.category;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.upload.SingleImageService;
import com.astraval.ecommercebackend.common.exception.BadRequestException;
class CategoryManagementTests {
 @Test void assignedProductsBlockDeletion() {
  var repo=mock(CategoryRepository.class); var products=mock(ProductRepository.class);
  var category=new Category(); category.setCategoryId(3);
  when(repo.findById(3)).thenReturn(Optional.of(category));
  when(products.countByCategoryCategoryId(3)).thenReturn(2L);
  var service=new CategoryService(repo,products,mock(SingleImageService.class));
  assertThatThrownBy(()->service.deleteCategory(3)).isInstanceOf(BadRequestException.class);
  verify(repo,never()).delete(any());
 }
 @Test void childCategoriesBlockDeletion() {
  var repo=mock(CategoryRepository.class); var products=mock(ProductRepository.class);
  var category=new Category(); category.setCategoryId(3);
  when(repo.findById(3)).thenReturn(Optional.of(category));
  when(repo.existsByParentCategoryCategoryId(3)).thenReturn(true);
  var service=new CategoryService(repo,products,mock(SingleImageService.class));
  assertThatThrownBy(()->service.deleteCategory(3)).isInstanceOf(BadRequestException.class);
  verify(repo,never()).delete(any());
 }
}
