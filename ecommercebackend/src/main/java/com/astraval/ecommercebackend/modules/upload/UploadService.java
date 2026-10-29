package com.astraval.ecommercebackend.modules.upload;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.upload.dto.UploadResponse;

@Service
public class UploadService {

    private final UploadRepository uploadRepository;
    private final ProductRepository productRepository;
    private final SecurityUtil securityUtil;
    private final R2StorageService storageService;
    private final ImageConversionService imageConversionService;
    private final int maxFilesPerRequest;

    public UploadService(
            UploadRepository uploadRepository,
            ProductRepository productRepository,
            SecurityUtil securityUtil,
            R2StorageService storageService,
            ImageConversionService imageConversionService,
            @Value("${upload.image.max-files-per-request:8}") int maxFilesPerRequest) {
        this.uploadRepository = uploadRepository;
        this.productRepository = productRepository;
        this.securityUtil = securityUtil;
        this.storageService = storageService;
        this.imageConversionService = imageConversionService;
        this.maxFilesPerRequest = maxFilesPerRequest;
    }

    @Transactional
    public List<UploadResponse> uploadProductImages(Long productId, List<MultipartFile> files) {
        ensureProductExists(productId);
        validateFiles(files);

        String createdBy = securityUtil.getCurrentSub();
        if (!StringUtils.hasText(createdBy)) {
            throw new BadRequestException("Invalid authenticated user identifier");
        }
        if (!storageService.isEnabled()) {
            throw new IllegalStateException("R2 image storage is not enabled");
        }

        List<Upload> storedUploads = new ArrayList<>();
        List<String> uploadedSourceKeys = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                ImageConversionService.ImageInfo imageInfo = imageConversionService.inspect(file);
                Upload upload = createPendingUpload(productId, file, imageInfo, createdBy);

                try (InputStream inputStream = file.getInputStream()) {
                    storageService.upload(
                            upload.getUploadedPath(),
                            inputStream,
                            file.getSize(),
                            imageInfo.contentType());
                }

                uploadedSourceKeys.add(upload.getUploadedPath());
                storedUploads.add(uploadRepository.save(upload));
            }
            return storedUploads.stream().map(this::toUploadResponse).toList();
        } catch (IOException | RuntimeException ex) {
            uploadedSourceKeys.forEach(storageService::deleteQuietly);
            if (ex instanceof BadRequestException badRequestException) {
                throw badRequestException;
            }
            throw new IllegalStateException("Unable to queue product images for processing", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<UploadResponse> getProductImages(Long productId) {
        ensureProductExists(productId);
        return getProductImagesByRelatedId(String.valueOf(productId));
    }

    @Transactional(readOnly = true)
    public List<UploadResponse> getProductImagesByRelatedId(String relatedId) {
        return uploadRepository.findByRelatedIdAndUploadTypeAndIsActiveTrueOrderByCreatedDtAsc(
                        relatedId,
                        UploadType.PRODUCT_IMAGE.name())
                .stream()
                .map(this::toUploadResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UploadResponse getUploadResponse(String uploadId) {
        if (!StringUtils.hasText(uploadId)) {
            return null;
        }
        return uploadRepository.findById(uploadId)
                .filter(upload -> Boolean.TRUE.equals(upload.getIsActive()))
                .map(this::toUploadResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, UploadResponse> getUploadResponses(List<String> uploadIds) {
        if (uploadIds == null || uploadIds.isEmpty()) {
            return Map.of();
        }
        return uploadRepository.findAllById(uploadIds).stream()
                .filter(upload -> Boolean.TRUE.equals(upload.getIsActive()))
                .map(this::toUploadResponse)
                .collect(Collectors.toMap(UploadResponse::uploadId, Function.identity()));
    }

    public UploadResponse toUploadResponse(Upload upload) {
        boolean ready = upload.getProcessingStatus() == ImageProcessingStatus.READY;
        return new UploadResponse(
                upload.getUploadId(),
                upload.getFilename(),
                upload.getStoredFilename(),
                upload.getUploadType(),
                upload.getUploadedPath(),
                upload.getRelatedId(),
                upload.getFileType(),
                upload.getIsActive(),
                upload.getCreatedDt(),
                upload.getCreatedBy(),
                upload.getProcessingStatus(),
                upload.getProcessingError(),
                upload.getOriginalWidth(),
                upload.getOriginalHeight(),
                ready ? storageService.publicUrl(upload.getThumbnailObjectKey()) : null,
                ready ? storageService.publicUrl(upload.getMediumObjectKey()) : null,
                ready ? storageService.publicUrl(upload.getLargeObjectKey()) : null);
    }

    private Upload createPendingUpload(
            Long productId,
            MultipartFile file,
            ImageConversionService.ImageInfo imageInfo,
            String createdBy) {
        String uploadId = UUID.randomUUID().toString();
        String sourceObjectKey = "products/%d/%s/source".formatted(productId, uploadId);

        Upload upload = new Upload();
        upload.setUploadId(uploadId);
        upload.setFilename(normalizeOriginalFilename(file.getOriginalFilename()));
        upload.setStoredFilename("source");
        upload.setUploadType(UploadType.PRODUCT_IMAGE.name());
        upload.setUploadedPath(sourceObjectKey);
        upload.setRelatedId(String.valueOf(productId));
        upload.setFileType(imageInfo.contentType());
        upload.setOriginalWidth(imageInfo.width());
        upload.setOriginalHeight(imageInfo.height());
        upload.setProcessingStatus(ImageProcessingStatus.PENDING);
        upload.setProcessingAttempts(0);
        upload.setIsActive(true);
        upload.setCreatedBy(createdBy);
        return upload;
    }

    private void ensureProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found");
        }
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("At least one file is required");
        }
        if (files.size() > maxFilesPerRequest) {
            throw new BadRequestException("A maximum of " + maxFilesPerRequest + " images can be uploaded at once");
        }
        if (files.stream().anyMatch(file -> file == null || file.isEmpty())) {
            throw new BadRequestException("Uploaded files must not be empty");
        }
    }

    private String normalizeOriginalFilename(String originalFilename) {
        String cleaned = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        if (!StringUtils.hasText(cleaned)) {
            throw new BadRequestException("File name is required");
        }
        if (cleaned.contains("..")) {
            throw new BadRequestException("Invalid file name");
        }
        return cleaned;
    }
}
