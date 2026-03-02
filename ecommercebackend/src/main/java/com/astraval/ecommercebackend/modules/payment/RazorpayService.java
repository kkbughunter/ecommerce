package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RazorpayService {

    private final RazorpayClient razorpayClient;

    @Value("${RAZORPAY_KEY_ID}")
    private String keyId;

    @Value("${RAZORPAY_KEY_SECRET}")
    private String keySecret;

    @Value("${RAZORPAY_WEBHOOK_SECRET:}")
    private String webhookSecret;

    public RazorpayService(RazorpayClient razorpayClient) {
        this.razorpayClient = razorpayClient;
    }

    public String getKeyId() {
        return keyId;
    }

    public Order createOrder(BigDecimal amount, String currency, String receipt) throws RazorpayException {
        org.json.JSONObject orderRequest = new org.json.JSONObject();
        orderRequest.put("amount", amount.multiply(new BigDecimal("100")).longValue());
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);

        return razorpayClient.orders.create(orderRequest);
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String expectedSignature = generateHmacSha256(payload, keySecret);
            return MessageDigest.isEqual(
                    razorpaySignature.getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Error verifying payment signature", e);
            return false;
        }
    }

    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            String expectedSignature = generateHmacSha256(payload, webhookSecret);
            return MessageDigest.isEqual(
                    signature.getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }

    private String generateHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
