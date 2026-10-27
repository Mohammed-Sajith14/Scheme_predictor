package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "schemes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scheme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String department;
    
    @Column(length = 2000)
    private String description;
    
    @Column(length = 2000)
    private String benefits;
    
    private String category;
    
    @Column(name = "beneficiary_type")
    private String beneficiaryType;
    
    private String state;
    
    @Column(name = "application_process", length = 2000)
    private String applicationProcess;
    
    @Column(name = "required_documents", length = 2000)
    private String requiredDocuments;
    
    private LocalDate deadline;
    
    @Column(name = "official_url")
    private String officialUrl;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    private String status; // DRAFT, PUBLISHED, INACTIVE

    @Builder.Default
    private Integer version = 1;

    @Column(name = "scheme_type")
    private String schemeType;

    @Column(name = "target_beneficiary")
    private String targetBeneficiary;

    @Column(name = "tags_keywords", length = 1000)
    private String tagsKeywords;

    @Column(name = "official_scheme_id")
    private String officialSchemeId;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isEmpty()) {
            status = "PUBLISHED";
        }
        if (version == null) {
            version = 1;
        }
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
