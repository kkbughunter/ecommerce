package com.astraval.ecommercebackend.modules.upload.dto;

import java.time.LocalDateTime;

public record UploadResponse(
        String uploadId,
        String filename,
        String storedFilename,
        String uploadType,
        String uploadedPath,
        String relatedId,
        String fileType,
        Boolean isActive,
        LocalDateTime createdDt,
        String createdBy) {
}
