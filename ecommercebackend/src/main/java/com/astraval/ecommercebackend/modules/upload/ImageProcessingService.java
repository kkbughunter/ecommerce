package com.astraval.ecommercebackend.modules.upload;

import java.awt.image.BufferedImage;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ImageProcessingService {

    private static final String WEBP_CONTENT_TYPE = "image/webp";
    private static final int THUMBNAIL_SIZE = 320;
    private static final int MEDIUM_SIZE = 800;
    private static final int LARGE_SIZE = 1600;

    private final UploadRepository uploadRepository;
    private final R2StorageService storageService;
    private final ImageConversionService conversionService;
    private final int maxProcessingAttempts;

    public ImageProcessingService(
            UploadRepository uploadRepository,
            R2StorageService storageService,
            ImageConversionService conversionService,
            @Value("${upload.image.max-processing-attempts:3}") int maxProcessingAttempts) {
        this.uploadRepository = uploadRepository;
        this.storageService = storageService;
        this.conversionService = conversionService;
        this.maxProcessingAttempts = maxProcessingAttempts;
    }

    public void process(String uploadId) {
        Upload upload = uploadRepository.findById(uploadId).orElse(null);
        if (upload == null || upload.getProcessingStatus() != ImageProcessingStatus.PENDING) {
            return;
        }

        upload.setProcessingStatus(ImageProcessingStatus.PROCESSING);
        upload.setProcessingAttempts(upload.getProcessingAttempts() + 1);
        upload.setProcessingError(null);
        uploadRepository.saveAndFlush(upload);

        String sourceObjectKey = upload.getUploadedPath();
        String objectPrefix = "products/%s/%s".formatted(upload.getRelatedId(), upload.getUploadId());
        String thumbnailKey = objectPrefix + "/thumbnail-320.webp";
        String mediumKey = objectPrefix + "/medium-800.webp";
        String largeKey = objectPrefix + "/large-1600.webp";

        try {
            byte[] sourceBytes = storageService.download(sourceObjectKey);
            BufferedImage source = conversionService.decode(sourceBytes);

            storageService.upload(
                    thumbnailKey,
                    conversionService.toWebp(source, THUMBNAIL_SIZE, 0.78),
                    WEBP_CONTENT_TYPE);
            storageService.upload(
                    mediumKey,
                    conversionService.toWebp(source, MEDIUM_SIZE, 0.82),
                    WEBP_CONTENT_TYPE);
            storageService.upload(
                    largeKey,
                    conversionService.toWebp(source, LARGE_SIZE, 0.85),
                    WEBP_CONTENT_TYPE);

            upload.setThumbnailObjectKey(thumbnailKey);
            upload.setMediumObjectKey(mediumKey);
            upload.setLargeObjectKey(largeKey);
            upload.setUploadedPath(largeKey);
            upload.setStoredFilename("large-1600.webp");
            upload.setFileType(WEBP_CONTENT_TYPE);
            upload.setProcessingStatus(ImageProcessingStatus.READY);
            upload.setProcessingError(null);
            upload.setProcessedDt(LocalDateTime.now());
            uploadRepository.save(upload);
            storageService.deleteQuietly(sourceObjectKey);
            log.info("Processed product image {} into R2 WebP variants", uploadId);
        } catch (RuntimeException ex) {
            storageService.deleteQuietly(thumbnailKey);
            storageService.deleteQuietly(mediumKey);
            storageService.deleteQuietly(largeKey);

            upload.setProcessingError(truncate(ex.getMessage()));
            upload.setProcessingStatus(
                    upload.getProcessingAttempts() < maxProcessingAttempts
                            ? ImageProcessingStatus.PENDING
                            : ImageProcessingStatus.FAILED);
            uploadRepository.save(upload);
            log.error(
                    "Image processing attempt {}/{} failed for upload {}",
                    upload.getProcessingAttempts(),
                    maxProcessingAttempts,
                    uploadId,
                    ex);
        }
    }

    private String truncate(String message) {
        String value = message == null || message.isBlank() ? "Image processing failed" : message;
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }
}
