package com.astraval.ecommercebackend.modules.upload;

import java.io.IOException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.astraval.ecommercebackend.common.exception.BadRequestException;

/** Stores only objects created by this service; user-supplied URLs never establish ownership. */
@Service
public class SingleImageService {
    private final R2StorageService storage;
    private final ImageConversionService conversion;
    private final ImageDeletionQueue deletions;
    public SingleImageService(R2StorageService storage, ImageConversionService conversion, ImageDeletionQueue deletions) {
        this.deletions = deletions;
        this.storage = storage;
        this.conversion = conversion;
    }
    public record UploadedImage(String url, String key) {}
    public static void validateSingle(MultipartHttpServletRequest request) {
        long count = request.getMultiFileMap().values().stream().flatMap(java.util.Collection::stream)
                .filter(file -> !"request".equals(file.getName())).count();
        if (count > 1 || request.getMultiFileMap().keySet().stream()
                .anyMatch(name -> !name.equals("file") && !name.equals("request"))) {
            throw new BadRequestException("Exactly one image file is supported");
        }
    }
    public UploadedImage upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Image file is empty");
        if (!storage.isEnabled()) throw new BadRequestException("Image storage is not configured");
        conversion.inspect(file);
        String key = "content/" + folder + "/" + UUID.randomUUID() + ".webp";
        try {
            byte[] content = conversion.toWebp(conversion.decode(file.getBytes()), 2400, 0.85);
            storage.upload(key, content, "image/webp");
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED) storage.deleteQuietly(key);
                    }
                });
            }
            return new UploadedImage(storage.publicUrl(key), key);
        } catch (IOException ex) {
            storage.deleteQuietly(key);
            throw new BadRequestException("Unable to read uploaded image");
        } catch (RuntimeException ex) {
            storage.deleteQuietly(key);
            throw ex;
        }
    }
    public void deleteAfterCommit(String key) {
        if (key == null || !key.matches("content/(category|home-slider|main-banner)/[A-Za-z0-9-]+\\.webp")) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // Never remove storage before an untracked database write has committed.
            return;
        }
        deletions.enqueue(key);
    }
}
