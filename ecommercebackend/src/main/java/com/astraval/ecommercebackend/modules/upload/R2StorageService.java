package com.astraval.ecommercebackend.modules.upload;

import java.io.InputStream;
import java.net.URI;
import java.util.Optional;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.astraval.ecommercebackend.config.R2Properties;

import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class R2StorageService {

    private static final String IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

    private final ObjectProvider<S3Client> s3ClientProvider;
    private final R2Properties properties;

    public R2StorageService(ObjectProvider<S3Client> s3ClientProvider, R2Properties properties) {
        this.s3ClientProvider = s3ClientProvider;
        this.properties = properties;
    }

    public void upload(String objectKey, InputStream inputStream, long contentLength, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(objectKey)
                .contentType(contentType)
                .cacheControl(IMMUTABLE_CACHE_CONTROL)
                .build();
        client().putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
    }

    public void upload(String objectKey, byte[] content, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(objectKey)
                .contentType(contentType)
                .cacheControl(IMMUTABLE_CACHE_CONTROL)
                .build();
        client().putObject(request, RequestBody.fromBytes(content));
    }

    public byte[] download(String objectKey) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(objectKey)
                .build();
        ResponseBytes<GetObjectResponse> response = client().getObjectAsBytes(request);
        return response.asByteArray();
    }

    public void deleteQuietly(String objectKey) {
        if (!StringUtils.hasText(objectKey) || !properties.isEnabled()) {
            return;
        }
        try {
            client().deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .build());
        } catch (RuntimeException ignored) {
            // Cleanup is best-effort and must not hide the primary operation result.
        }
    }

    public String publicUrl(String objectKey) {
        if (!StringUtils.hasText(objectKey)) {
            return null;
        }
        String baseUrl = properties.getPublicUrl().replaceAll("/+$", "");
        return URI.create(baseUrl + "/" + objectKey).toASCIIString();
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public void verifyAccess() {
        client().headBucket(HeadBucketRequest.builder().bucket(properties.getBucket()).build());
    }

    private S3Client client() {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("R2 image storage is disabled");
        }
        return Optional.ofNullable(s3ClientProvider.getIfAvailable())
                .orElseThrow(() -> new IllegalStateException("R2 client is not configured"));
    }
}
