package com.astraval.ecommercebackend.modules.upload;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import lombok.extern.slf4j.Slf4j;

/** Durable deletion outbox: rollback retains both the old image and its owning row. */
@Service
@Slf4j
public class ImageDeletionQueue {
    private final ImageDeletionRepository repository;
    private final R2StorageService storage;
    private final TransactionTemplate transaction;
    public ImageDeletionQueue(ImageDeletionRepository repository, R2StorageService storage,
            PlatformTransactionManager manager) {
        this.repository = repository;
        this.storage = storage;
        this.transaction = new TransactionTemplate(manager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }
    public void enqueue(String key) {
        ImageDeletion deletion = new ImageDeletion();
        deletion.setObjectKey(key);
        Long id = repository.save(deletion).getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { process(id); }
        });
    }
    @Scheduled(fixedDelayString = "${upload.image.cleanup-delay-ms:60000}", initialDelay = 60000)
    public void retryPending() {
        if (!storage.isEnabled()) return;
        repository.findTop100ByOrderByIdAsc().forEach(deletion -> process(deletion.getId()));
    }
    private void process(Long id) {
        if (!storage.isEnabled()) return;
        try {
            transaction.executeWithoutResult(status -> repository.findById(id).ifPresent(deletion -> {
                storage.delete(deletion.getObjectKey());
                repository.delete(deletion);
            }));
        } catch (RuntimeException ex) {
            log.warn("Image deletion {} remains queued for retry: {}", id, ex.getMessage());
        }
    }
}
