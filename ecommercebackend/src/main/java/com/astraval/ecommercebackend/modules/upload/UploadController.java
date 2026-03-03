package com.astraval.ecommercebackend.modules.upload;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.upload.dto.UploadFileContent;
import com.astraval.ecommercebackend.modules.upload.dto.UploadResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/products/{productId}/images")
@Tag(name = "Upload APIs", description = "Operations related to product image uploads")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple product images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UploadResponse>>> uploadProductImages(
            @PathVariable Long productId,
            @RequestParam("files") List<MultipartFile> files) {
        List<UploadResponse> response = uploadService.uploadProductImages(productId, files);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Product images uploaded successfully"));
    }

    @GetMapping
    @Operation(summary = "Get all active images for a product")
    public ResponseEntity<ApiResponse<List<UploadResponse>>> getProductImages(@PathVariable Long productId) {
        List<UploadResponse> response = uploadService.getProductImages(productId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product images fetched successfully"));
    }

    @GetMapping("/{uploadId}/file")
    @Operation(summary = "Get product image file")
    public ResponseEntity<Resource> getProductImageFile(
            @PathVariable Long productId,
            @PathVariable String uploadId) {
        UploadFileContent fileContent = uploadService.getProductImageFile(productId, uploadId);
        return ResponseEntity.ok()
                .contentType(fileContent.mediaType())
                .contentLength(fileContent.contentLength())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileContent.filename()).build().toString())
                .body(fileContent.resource());
    }
}
