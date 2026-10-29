package com.astraval.ecommercebackend.modules.upload;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadRepository extends JpaRepository<Upload, String> {

    List<Upload> findByRelatedIdAndUploadTypeAndIsActiveTrueOrderByCreatedDtAsc(String relatedId, String uploadType);

    boolean existsByUploadIdAndRelatedIdAndUploadTypeAndIsActiveTrue(
            String uploadId,
            String relatedId,
            String uploadType);

    List<Upload> findByProcessingStatusOrderByCreatedDtAsc(ImageProcessingStatus processingStatus);

    List<Upload> findByProcessingStatusOrderByCreatedDtAsc(
            ImageProcessingStatus processingStatus,
            Pageable pageable);
}
