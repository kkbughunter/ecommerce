package com.astraval.ecommercebackend.modules.upload;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
@SpringBootTest(properties = {
 "spring.datasource.url=jdbc:h2:mem:image-deletion;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
 "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
 "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
 "spring.jpa.defer-datasource-initialization=false", "r2.enabled=false",
 "jwt.secret=test-secret-key-test-secret-key-123456"
})
class ImageDeletionQueueTests {
 @Autowired ImageDeletionQueue queue;
 @Autowired ImageDeletionRepository repository;
 @Autowired PlatformTransactionManager manager;
 @MockitoBean R2StorageService storage;
 @BeforeEach void clean() { repository.deleteAll(); when(storage.isEnabled()).thenReturn(true); }
 @Test void deletionRunsAfterCommitAndTaskIsRemovedOnSuccess() {
  new TransactionTemplate(manager).executeWithoutResult(status -> {
   queue.enqueue("content/category/owned.webp");
   verify(storage,never()).delete(anyString());
  });
  verify(storage).delete("content/category/owned.webp");
  assertThat(repository.count()).isZero();
 }
 @Test void rollbackRetainsImageAndDiscardsDeletionTask() {
  new TransactionTemplate(manager).executeWithoutResult(status -> {
   queue.enqueue("content/main-banner/old.webp"); status.setRollbackOnly();
  });
  verify(storage,never()).delete(anyString());
  assertThat(repository.count()).isZero();
 }
 @Test void failedDeletionRemainsDurableUntilRetrySucceeds() {
  doThrow(new IllegalStateException("storage unavailable")).when(storage).delete(anyString());
  new TransactionTemplate(manager).executeWithoutResult(status -> queue.enqueue("content/home-slider/old.webp"));
  assertThat(repository.count()).isEqualTo(1);
  doNothing().when(storage).delete(anyString());
  queue.retryPending();
  verify(storage,times(2)).delete("content/home-slider/old.webp");
  assertThat(repository.count()).isZero();
 }
}
