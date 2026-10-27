package com.schemewise.backend.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EncryptedIntegerConverter implements AttributeConverter<Integer, String> {

    @Override
    public String convertToDatabaseColumn(Integer attribute) {
        if (attribute == null) return null;
        return DataWalletCryptoUtil.encrypt(String.valueOf(attribute));
    }

    @Override
    public Integer convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) return null;
        String decrypted = DataWalletCryptoUtil.decrypt(dbData);
        if (decrypted == null || decrypted.trim().isEmpty()) return null;
        try {
            return Integer.parseInt(decrypted.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
