package com.schemewise.backend.model;

import com.schemewise.backend.config.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataWallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    @Convert(converter = EncryptedLocalDateConverter.class)
    @Column(name = "date_of_birth", columnDefinition = "TEXT")
    private LocalDate dateOfBirth;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "gender", columnDefinition = "TEXT")
    private String gender;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "state", columnDefinition = "TEXT")
    private String state;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "district", columnDefinition = "TEXT")
    private String district;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "urban_rural", columnDefinition = "TEXT")
    private String urbanRural;
    
    @Convert(converter = EncryptedDoubleConverter.class)
    @Column(name = "income", columnDefinition = "TEXT")
    private Double income;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "occupation", columnDefinition = "TEXT")
    private String occupation;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "employment_status", columnDefinition = "TEXT")
    private String employmentStatus;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "education", columnDefinition = "TEXT")
    private String education;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "student_status", columnDefinition = "TEXT")
    private String studentStatus;
    
    @Convert(converter = EncryptedIntegerConverter.class)
    @Column(name = "family_size", columnDefinition = "TEXT")
    private Integer familySize;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "marital_status", columnDefinition = "TEXT")
    private String maritalStatus;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "farmer_status", columnDefinition = "TEXT")
    private String farmerStatus;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "land_ownership", columnDefinition = "TEXT")
    private String landOwnership;
    
    @Convert(converter = EncryptedDoubleConverter.class)
    @Column(name = "land_area", columnDefinition = "TEXT")
    private Double landArea;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "disability_status", columnDefinition = "TEXT")
    private String disabilityStatus;
    
    @Convert(converter = EncryptedDoubleConverter.class)
    @Column(name = "disability_percentage", columnDefinition = "TEXT")
    private Double disabilityPercentage;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "disability_certificate_status", columnDefinition = "TEXT")
    private String disabilityCertificateStatus;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "housing_status", columnDefinition = "TEXT")
    private String housingStatus;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "existing_benefits", columnDefinition = "TEXT")
    private String existingBenefits;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "additional_attributes", columnDefinition = "TEXT")
    private String additionalAttributes;
    
    @Column(name = "profile_completion")
    private Double profileCompletion;

    @Column(name = "wallet_hash", length = 64)
    private String walletHash;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        
        // Calculate SHA-256 Hash Digest of all wallet data
        StringBuilder sb = new StringBuilder();
        sb.append(userId != null ? userId : "").append("|");
        sb.append(dateOfBirth != null ? dateOfBirth : "").append("|");
        sb.append(gender != null ? gender : "").append("|");
        sb.append(state != null ? state : "").append("|");
        sb.append(district != null ? district : "").append("|");
        sb.append(income != null ? income : "").append("|");
        sb.append(occupation != null ? occupation : "").append("|");
        sb.append(education != null ? education : "").append("|");
        sb.append(studentStatus != null ? studentStatus : "").append("|");
        sb.append(additionalAttributes != null ? additionalAttributes : "");
        
        this.walletHash = DataWalletCryptoUtil.computeSha256Hash(sb.toString());
    }
}
