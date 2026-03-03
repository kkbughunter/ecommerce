package com.astraval.ecommercebackend.modules.upload;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "tbluploads", indexes = {
        @Index(name = "idx_tbluploads_related_upload_type", columnList = "related_iD,upload_type"),
        @Index(name = "idx_tbluploads_is_active", columnList = "is_active")
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
    }
}
