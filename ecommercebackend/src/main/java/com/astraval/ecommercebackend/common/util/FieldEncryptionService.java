package com.astraval.ecommercebackend.common.util;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * AES-256 GCM authenticated encryption/decryption for sensitive database fields
 * such as Razorpay credentials stored in seller_razorpay_configs.
 *
 * AES/GCM/NoPadding provides both confidentiality and integrity (authenticated
 * encryption), protecting against padding-oracle and ciphertext-tampering
 * attacks.
 *
 * The encryption key must be exactly 32 bytes (256-bit) UTF-8 string,
 * configured
 * via the property {@code app.field-encryption-key} or the environment variable
 * {@code FIELD_ENCRYPTION_KEY}.
 *
 * Encrypted value format (Base64-encoded): IV (12 bytes) || GCM ciphertext+tag
 */
@Service
public class FieldEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12; // 96-bit IV recommended for GCM
    private static final int GCM_TAG_BITS = 128;

    private final SecretKeySpec secretKeySpec;

    /**
     * @param encryptionKey AES-256 key — exactly 32 UTF-8 characters.
     *                      If blank/empty the service starts but throws at
     *                      encrypt/decrypt time, so the app can boot without
     *                      the key when the seller Razorpay feature is not yet
     *                      used.
     */
    public FieldEncryptionService(
            @Value("${app.field-encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            this.secretKeySpec = null; // key not configured yet
        } else {
            byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length != 32) {
                throw new IllegalStateException(
                        "app.field-encryption-key must be exactly 32 UTF-8 characters (256-bit AES key)");
            }
            this.secretKeySpec = new SecretKeySpec(keyBytes, "AES");
        }
    }

    private void requireKey() {
        if (secretKeySpec == null) {
            throw new IllegalStateException(
                    "app.field-encryption-key is not configured. " +
                            "Set FIELD_ENCRYPTION_KEY to an exactly 32-character string to enable seller Razorpay credential storage.");
        }
    }

    /**
     * Encrypts a plain-text value and returns a Base64-encoded string containing
     * the IV (12 bytes) prepended to the GCM ciphertext+authentication tag.
     */
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        requireKey();
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_BITS, iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, gcmSpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] ivAndCipherText = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, ivAndCipherText, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, ivAndCipherText, IV_LENGTH, encrypted.length);

            return Base64.getEncoder().encodeToString(ivAndCipherText);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encrypt field value", ex);
        }
    }

    /**
     * Decrypts a Base64-encoded encrypted value (IV || GCM ciphertext+tag).
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null) {
            return null;
        }
        requireKey();
        try {
            byte[] ivAndCipherText = Base64.getDecoder().decode(encryptedBase64);
            byte[] iv = new byte[IV_LENGTH];
            byte[] cipherText = new byte[ivAndCipherText.length - IV_LENGTH];
            System.arraycopy(ivAndCipherText, 0, iv, 0, IV_LENGTH);
            System.arraycopy(ivAndCipherText, IV_LENGTH, cipherText, 0, cipherText.length);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_BITS, iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmSpec);
            byte[] decrypted = cipher.doFinal(cipherText);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to decrypt field value", ex);
        }
    }
}
