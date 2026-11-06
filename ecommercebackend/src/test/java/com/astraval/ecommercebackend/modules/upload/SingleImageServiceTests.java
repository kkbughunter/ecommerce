package com.astraval.ecommercebackend.modules.upload;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;
class SingleImageServiceTests {
 @AfterEach void clear() { if(TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization(); }
 @Test void onlyOwnedKeysEnterDurableDeletionQueue() {
  var storage=mock(R2StorageService.class);
  var queue=mock(ImageDeletionQueue.class);
  var service=new SingleImageService(storage,mock(ImageConversionService.class),queue);
  TransactionSynchronizationManager.initSynchronization();
  service.deleteAfterCommit("content/category/owned.webp");
  verify(queue).enqueue("content/category/owned.webp");
  service.deleteAfterCommit("https://external.example/image.jpg");
  service.deleteAfterCommit("products/other-image.webp");
  verifyNoMoreInteractions(queue);
  verifyNoInteractions(storage);
 }

 @Test void rollbackDeletesNewUploadButCommitRetainsIt() throws Exception {
  for (int status : new int[]{TransactionSynchronization.STATUS_ROLLED_BACK, TransactionSynchronization.STATUS_COMMITTED}) {
   var storage=mock(R2StorageService.class); when(storage.isEnabled()).thenReturn(true);
   var conversion=mock(ImageConversionService.class);
   when(conversion.toWebp(any(),eq(2400),eq(0.85))).thenReturn(new byte[]{1});
   when(storage.publicUrl(anyString())).thenAnswer(i -> "https://cdn.example/"+i.getArgument(0));
   TransactionSynchronizationManager.initSynchronization();
   var service=new SingleImageService(storage,conversion,mock(ImageDeletionQueue.class));
   var image=service.upload(new org.springframework.mock.web.MockMultipartFile("file","image.png","image/png",new byte[]{1}),"category");
   assertThat(image.url()).startsWith("https://cdn.example/content/category/");
   TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(status));
   verify(storage, times(status == TransactionSynchronization.STATUS_ROLLED_BACK ? 1 : 0)).deleteQuietly(image.key());
   TransactionSynchronizationManager.clearSynchronization();
  }
 }
 @Test void rejectsMultipleFilesAndUnknownFileParts() {
  var request=new org.springframework.mock.web.MockMultipartHttpServletRequest();
  request.addFile(new org.springframework.mock.web.MockMultipartFile("file",new byte[]{1}));
  request.addFile(new org.springframework.mock.web.MockMultipartFile("file",new byte[]{2}));
  assertThatThrownBy(()->SingleImageService.validateSingle(request)).isInstanceOf(com.astraval.ecommercebackend.common.exception.BadRequestException.class);
 }
 @Test void rollbackNeverRemovesPreviousImage() {
  var storage=mock(R2StorageService.class);
  TransactionSynchronizationManager.initSynchronization();
  new SingleImageService(storage,mock(ImageConversionService.class),mock(ImageDeletionQueue.class)).deleteAfterCommit("content/home-slider/old.webp");
  TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
  verifyNoInteractions(storage);
 }
}
