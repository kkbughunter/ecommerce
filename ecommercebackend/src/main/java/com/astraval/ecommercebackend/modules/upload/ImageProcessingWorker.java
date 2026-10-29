package com.astraval.ecommercebackend.modules.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ImageProcessingWorker {

    private final UploadRepository uploadRepository;
    private final ImageProcessingService imageProcessingService;
    private final R2StorageService storageService;
    private final int batchSize;

    public ImageProcessingWorker(
            UploadRepository uploadRepository,
            ImageProcessingService imageProcessingService,
            R2StorageService storageService,
            @Value("${upload.image.worker-batch-size:5}") int batchSize) {
        this.uploadRepository = uploadRepository;
        this.imageProcessingService = imageProcessingService;
        this.storageService = storageService;
        this.batchSize = batchSize;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recoverInterruptedJobs() {
        if (storageService.isEnabled()) {
            try {
                storageService.verifyAccess();
                log.info("R2 product image storage connection verified");
            } catch (RuntimeException ex) {
                log.error("R2 product image storage connection verification failed", ex);
            }
        }

        var interrupted = uploadRepository.findByProcessingStatusOrderByCreatedDtAsc(
                ImageProcessingStatus.PROCESSING);
        interrupted.forEach(upload -> upload.setProcessingStatus(ImageProcessingStatus.PENDING));
        if (!interrupted.isEmpty()) {
            uploadRepository.saveAll(interrupted);
            log.info("Recovered {} interrupted image processing job(s)", interrupted.size());
        }
    }

    @Scheduled(fixedDelayString = "${upload.image.worker-delay-ms:2000}")
    public void processPendingImages() {
        if (!storageService.isEnabled()) {
            return;
        }
        uploadRepository.findByProcessingStatusOrderByCreatedDtAsc(
                        ImageProcessingStatus.PENDING,
                        PageRequest.of(0, batchSize))
                .stream()
                .map(Upload::getUploadId)
                .forEach(imageProcessingService::process);
    }
}
