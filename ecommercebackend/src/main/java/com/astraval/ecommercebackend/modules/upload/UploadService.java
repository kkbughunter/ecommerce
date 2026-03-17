package com.astraval.ecommercebackend.modules.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.seller.SellerProfile;
import com.astraval.ecommercebackend.modules.seller.SellerProfileRepository;
import com.astraval.ecommercebackend.modules.upload.dto.UploadFileContent;
import com.astraval.ecommercebackend.modules.upload.dto.UploadResponse;

@Service
public class UploadService {

    private final UploadRepository uploadRepository;
    private final ProductRepository productRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final SecurityUtil securityUtil;
    private final Path uploadRootPath;
    private final String productImageFolder;

    public UploadService(
            UploadRepository uploadRepository,
            ProductRepository productRepository,
            SellerProfileRepository sellerProfileRepository,
            SecurityUtil securityUtil,
            @Value("${upload.path:uploads}") String uploadPath,
            @Value("${upload.product-image-folder:products}") String productImageFolder) {
        this.uploadRepository = uploadRepository;
        this.productRepository = productRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.securityUtil = securityUtil;
        this.uploadRootPath = Paths.get(uploadPath).toAbsolutePath().normalize();
        this.productImageFolder = productImageFolder;
    }

    @Transactional
    public List<UploadResponse> uploadProductImages(Long productId, List<MultipartFile> files) {
        Product product = loadProduct(productId);
        validateFiles(files);

        Long actorUserId = getCurrentUserId();
        ensureSellerOwnsProduct(product, actorUserId);
        String createdBy = String.valueOf(actorUserId);

        return files.stream()
                .map(file -> storeProductImage(file, productId, createdBy))
                .map(uploadRepository::save)
                .map(this::toUploadResponse)
                .toList();
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
    public UploadFileContent getProductImageFile(Long productId, String uploadId) {
        ensureProductExists(productId);

        Upload upload = uploadRepository.findById(uploadId)
                .orElseThrow(() -> new ResourceNotFoundException("Upload not found"));

        if (!UploadType.PRODUCT_IMAGE.name().equals(upload.getUploadType())
                || !String.valueOf(productId).equals(upload.getRelatedId())
                || !Boolean.TRUE.equals(upload.getIsActive())) {
            throw new ResourceNotFoundException("Product image not found");
        }

        Path filePath = resolveUploadedPath(upload.getUploadedPath());
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("Image file not found");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Image file is not readable");
            }
            return new UploadFileContent(
                    resource,
                    resolveMediaType(upload, filePath),
                    upload.getFilename(),
                    Files.size(filePath));
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read uploaded file", ex);
        }
    }

    private Upload storeProductImage(MultipartFile file, Long productId, String createdBy) {
        String originalFilename = normalizeOriginalFilename(file.getOriginalFilename());
        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;

        Path relativeFilePath = Paths.get(productImageFolder)
                .resolve(String.valueOf(productId))
                .resolve(storedFilename)
                .normalize();

        Path targetPath = uploadRootPath
                .resolve(relativeFilePath)
                .normalize();

        Path productDirectory = uploadRootPath
                .resolve(productImageFolder)
                .resolve(String.valueOf(productId))
                .normalize();

        if (!targetPath.startsWith(uploadRootPath)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(productDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to store uploaded file", ex);
        }

        Upload upload = new Upload();
        upload.setFilename(originalFilename);
        upload.setStoredFilename(storedFilename);
        upload.setUploadType(UploadType.PRODUCT_IMAGE.name());
        upload.setUploadedPath(toUnixSeparators(relativeFilePath));
        upload.setRelatedId(String.valueOf(productId));
        upload.setFileType(file.getContentType());
        upload.setIsActive(true);
        upload.setCreatedBy(createdBy);
        return upload;
    }

    private void ensureProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found");
        }
    }

    private Product loadProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }

    private SellerProfile resolveSellerProfile(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
        return sellerProfileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new UnauthorizedException("Seller profile not found for this user"));
    }

    private void ensureSellerOwnsProduct(Product product, Long userId) {
        SellerProfile sellerProfile = resolveSellerProfile(userId);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found");
        }
        if (product.getSellerProfile() != null) {
            if (!product.getSellerProfile().getSellerProfileId().equals(sellerProfile.getSellerProfileId())) {
                throw new UnauthorizedException("You are not authorized to upload images for this product");
            }
            return;
        }
        if (product.getCreatedBy() == null || !product.getCreatedBy().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to upload images for this product");
        }
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("At least one file is required");
        }
        boolean hasEmptyFile = files.stream().anyMatch(file -> file == null || file.isEmpty());
        if (hasEmptyFile) {
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

    private String extractExtension(String originalFilename) {
        int extensionIndex = originalFilename.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == originalFilename.length() - 1) {
            return "";
        }
        return "." + originalFilename.substring(extensionIndex + 1).toLowerCase(Locale.ROOT);
    }

    private UploadResponse toUploadResponse(Upload upload) {
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
                upload.getCreatedBy());
    }

    private String toUnixSeparators(Path path) {
        return path.toString().replace("\\", "/");
    }

    private Path resolveUploadedPath(String uploadedPath) {
        if (!StringUtils.hasText(uploadedPath)) {
            throw new ResourceNotFoundException("Stored file path is missing");
        }

        Path rawPath = Paths.get(uploadedPath).normalize();
        Path resolvedPath = rawPath.isAbsolute()
                ? rawPath
                : uploadRootPath.resolve(rawPath).normalize();

        if (!resolvedPath.startsWith(uploadRootPath)) {
            throw new BadRequestException("Invalid stored upload path");
        }
        return resolvedPath;
    }

    private MediaType resolveMediaType(Upload upload, Path filePath) {
        if (StringUtils.hasText(upload.getFileType())) {
            try {
                return MediaType.parseMediaType(upload.getFileType());
            } catch (InvalidMediaTypeException ignored) {
                // Continue to probe content type.
            }
        }

        try {
            String probedType = Files.probeContentType(filePath);
            if (StringUtils.hasText(probedType)) {
                return MediaType.parseMediaType(probedType);
            }
        } catch (IOException | InvalidMediaTypeException ignored) {
            // Fallback to octet-stream when probing fails.
        }

        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
