package com.schemewise.backend.dto;

import com.schemewise.backend.model.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class SchemeDTO {
    private Long id;
    private String name;
    private String department;
    private String description;
    private String shortDescription;
    private String benefits;
    private String category;
    private String beneficiaryType;
    private String targetBeneficiary;
    private String schemeType;
    private String state;
    private String applicationProcess;
    private String requiredDocuments;
    private LocalDate deadline;
    private String officialUrl;
    private String imageUrl;
    private String status; // DRAFT, PUBLISHED, INACTIVE
    private Integer version;
    private String tagsKeywords;
    private String officialSchemeId;

    private List<SchemeRequirement> requirements;
    private List<SchemeBenefit> benefitsList;
    private List<SchemeDocument> documentsList;
    private List<SchemeApplicationStep> applicationSteps;
    private List<SchemeFAQ> faqs;
    private List<SchemeSource> sources;
}
