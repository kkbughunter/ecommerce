package com.astraval.ecommercebackend.modules.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayProperties {

    private String keyId;
    private String keySecret;
    private String webhookSecret;
    private String apiBaseUrl = "https://api.razorpay.com";
    private long createOrderTimeoutMs = 10000L;

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    public void setKeySecret(String keySecret) {
        this.keySecret = keySecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }

    public long getCreateOrderTimeoutMs() {
        return createOrderTimeoutMs;
    }

    public void setCreateOrderTimeoutMs(long createOrderTimeoutMs) {
        this.createOrderTimeoutMs = createOrderTimeoutMs;
    }
}
