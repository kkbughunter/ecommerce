package com.astraval.ecommercebackend.modules.upload.dto;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.upload.ImageProcessingStatus;

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
        String createdBy,
        ImageProcessingStatus processingStatus,
        String processingError,
        Integer originalWidth,
        Integer originalHeight,
        String thumbnailUrl,
        String mediumUrl,
        String largeUrl) {
}
