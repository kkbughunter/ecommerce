package com.astraval.ecommercebackend.config;

import java.net.URI;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
@EnableConfigurationProperties(R2Properties.class)
public class R2Config {

    @Bean
    @ConditionalOnProperty(name = "r2.enabled", havingValue = "true")
    S3Client r2S3Client(R2Properties properties) {
        requireText(properties.getEndpoint(), "R2 endpoint");
        requireText(properties.getAccessKeyId(), "R2 access key ID");
        requireText(properties.getSecretAccessKey(), "R2 secret access key");
        requireText(properties.getBucket(), "R2 bucket");
        requireText(properties.getPublicUrl(), "R2 public URL");

        S3Configuration serviceConfiguration = S3Configuration.builder()
                .chunkedEncodingEnabled(false)
                .pathStyleAccessEnabled(true)
                .build();

        return S3Client.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        properties.getAccessKeyId(),
                        properties.getSecretAccessKey())))
                .serviceConfiguration(serviceConfiguration)
                .build();
    }

    private void requireText(String value, String label) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(label + " must be configured when R2 is enabled");
        }
    }
}
