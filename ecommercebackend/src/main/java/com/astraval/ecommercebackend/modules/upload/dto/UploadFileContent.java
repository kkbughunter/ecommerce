package com.astraval.ecommercebackend.modules.upload.dto;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public record UploadFileContent(
        Resource resource,
        MediaType mediaType,
        String filename,
        long contentLength) {
}
