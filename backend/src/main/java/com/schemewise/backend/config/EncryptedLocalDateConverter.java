package com.schemewise.backend.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.LocalDate;

@Converter
public class EncryptedLocalDateConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        if (attribute == null) return null;
        return DataWalletCryptoUtil.encrypt(attribute.toString());
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) return null;
        String decrypted = DataWalletCryptoUtil.decrypt(dbData);
        if (decrypted == null || decrypted.trim().isEmpty()) return null;
        try {
            return LocalDate.parse(decrypted.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
