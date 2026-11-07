package com.astraval.ecommercebackend.modules.payment;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "cashfree")
public class CashfreeProperties {
    private String clientId;
    private String clientSecret;
    private String mode = "sandbox";
    private String apiVersion = "2025-01-01";
    public String apiBaseUrl() {
        return "production".equals(mode) ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    }
}
