package com.schemewise.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

@Component
@Slf4j
public class DataWalletCryptoUtil {

    private static final String SECRET_SEED = "schemewisesupersecretkeyforgeneratingsignatureswhichshouldbeatleast32byteslong";
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final SecretKeySpec AES_KEY;
    private static final SecretKeySpec HMAC_KEY;
    private static final SecureRandom RANDOM = new SecureRandom();

    static {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(SECRET_SEED.getBytes(StandardCharsets.UTF_8));
            AES_KEY = new SecretKeySpec(keyBytes, "AES");
            HMAC_KEY = new SecretKeySpec(keyBytes, HMAC_ALGORITHM);
        } catch (Exception e) {
            log.error("Failed to initialize DataWalletCryptoUtil secret keys", e);
            throw new RuntimeException(e);
        }
    }

    /**
     * Encrypts plaintext string into tamper-proof SHA-256 HMAC signed AES ciphertext for PostgreSQL storage.
     */
    public static String encrypt(String plaintext) {
        if (plaintext == null || plaintext.trim().isEmpty()) {
            return plaintext;
        }

        // If already encrypted, return as is
        if (plaintext.startsWith("ENC:SHA256:")) {
            return plaintext;
        }

        try {
            byte[] iv = new byte[16];
            RANDOM.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, AES_KEY, ivSpec);

            byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            String ivHex = HexFormat.of().formatHex(iv);
            String cipherHex = HexFormat.of().formatHex(encryptedBytes);

            // Compute HMAC SHA-256 digest
            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            hmac.init(HMAC_KEY);
            hmac.update(iv);
            byte[] digestBytes = hmac.doFinal(encryptedBytes);
            String digestHex = HexFormat.of().formatHex(digestBytes);

            return "ENC:SHA256:" + ivHex + ":" + cipherHex + ":" + digestHex;
        } catch (Exception e) {
            log.error("Error encrypting data wallet attribute", e);
            return plaintext;
        }
    }

    /**
     * Decrypts ciphertext loaded from PostgreSQL back into plaintext for application evaluation.
     */
    public static String decrypt(String cipherTextStr) {
        if (cipherTextStr == null || cipherTextStr.trim().isEmpty()) {
            return cipherTextStr;
        }

        if (!cipherTextStr.startsWith("ENC:SHA256:")) {
            // Unencrypted legacy fallback
            return cipherTextStr;
        }

        try {
            String[] parts = cipherTextStr.split(":");
            if (parts.length < 5) {
                return cipherTextStr;
            }

            String ivHex = parts[2];
            String cipherHex = parts[3];
            String digestHex = parts[4];

            byte[] iv = HexFormat.of().parseHex(ivHex);
            byte[] encryptedBytes = HexFormat.of().parseHex(cipherHex);

            // Verify HMAC digest
            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            hmac.init(HMAC_KEY);
            hmac.update(iv);
            byte[] computedDigest = hmac.doFinal(encryptedBytes);
            String computedDigestHex = HexFormat.of().formatHex(computedDigest);

            if (!computedDigestHex.equalsIgnoreCase(digestHex)) {
                log.warn("HMAC digest mismatch! Potential data tampering in PostgreSQL storage.");
                return cipherTextStr;
            }

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, AES_KEY, new IvParameterSpec(iv));

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Error decrypting data wallet attribute from PostgreSQL", e);
            return cipherTextStr;
        }
    }

    /**
     * Computes SHA-256 cryptographic hash fingerprint of complete DataWallet content.
     */
    public static String computeSha256Hash(String input) {
        if (input == null || input.isEmpty()) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "";
        }
    }
}
