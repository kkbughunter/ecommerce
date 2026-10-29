package com.astraval.ecommercebackend.modules.upload;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "tbluploads", indexes = {
        @Index(name = "idx_tbluploads_related_upload_type", columnList = "related_iD,upload_type"),
        @Index(name = "idx_tbluploads_is_active", columnList = "is_active"),
        @Index(name = "idx_tbluploads_processing_status", columnList = "processing_status")
})
public class Upload {

    @Id
    @Column(name = "Upload_iD", length = 36, nullable = false)
    private String uploadId;

    @Column(name = "file_name", length = 500, nullable = false)
    private String filename;

    @Column(name = "stored_filename", length = 500, nullable = false)
    private String storedFilename;

    @Column(name = "upload_type", length = 36, nullable = false)
    private String uploadType;

    @Column(name = "uploaded_path", length = 500, nullable = false)
    private String uploadedPath;

    @Column(name = "thumbnail_object_key", length = 500)
    private String thumbnailObjectKey;

    @Column(name = "medium_object_key", length = 500)
    private String mediumObjectKey;

    @Column(name = "large_object_key", length = 500)
    private String largeObjectKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", length = 20, nullable = false)
    private ImageProcessingStatus processingStatus = ImageProcessingStatus.PENDING;

    @Column(name = "processing_error", length = 1000)
    private String processingError;

    @Column(name = "processing_attempts", nullable = false)
    private Integer processingAttempts = 0;

    @Column(name = "original_width")
    private Integer originalWidth;

    @Column(name = "original_height")
    private Integer originalHeight;

    @Column(name = "processed_dt")
    private LocalDateTime processedDt;

    @Column(name = "related_iD", length = 36)
    private String relatedId;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

    @Column(name = "created_by", length = 36, nullable = false)
    private String createdBy;

    @PrePersist
    void onCreate() {
        if (uploadId == null || uploadId.isBlank()) {
            uploadId = UUID.randomUUID().toString();
        }
        if (createdDt == null) {
            createdDt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (processingStatus == null) {
            processingStatus = ImageProcessingStatus.PENDING;
        }
        if (processingAttempts == null) {
            processingAttempts = 0;
        }
    }
}
