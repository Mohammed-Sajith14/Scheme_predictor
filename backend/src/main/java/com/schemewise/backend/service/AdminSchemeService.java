package com.schemewise.backend.service;

import com.schemewise.backend.dto.SchemeDTO;
import com.schemewise.backend.model.*;
import com.schemewise.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminSchemeService {

    private final SchemeRepository schemeRepository;
    private final SchemeRequirementRepository requirementRepository;
    private final SchemeBenefitRepository benefitRepository;
    private final SchemeDocumentRepository documentRepository;
    private final SchemeApplicationStepRepository stepRepository;
    private final SchemeFAQRepository faqRepository;
    private final SchemeSourceRepository sourceRepository;
    private final AuditLogService auditLogService;
    private final AdminRagService adminRagService;
    private final ScoringEngineService scoringEngineService;

    public Map<String, Object> getDashboardStats() {
        List<Scheme> all = schemeRepository.findAll();
        long total = all.size();
        long published = all.stream().filter(s -> s.getStatus() == null || "PUBLISHED".equalsIgnoreCase(s.getStatus())).count();
        long draft = all.stream().filter(s -> "DRAFT".equalsIgnoreCase(s.getStatus())).count();
        long inactive = all.stream().filter(s -> "INACTIVE".equalsIgnoreCase(s.getStatus())).count();

        Set<String> categories = all.stream()
                .map(Scheme::getCategory)
                .filter(c -> c != null && !c.trim().isEmpty())
                .collect(Collectors.toSet());

        Set<String> departments = all.stream()
                .map(Scheme::getDepartment)
                .filter(d -> d != null && !d.trim().isEmpty())
                .collect(Collectors.toSet());

        List<AuditLog> recentLogs = auditLogService.getAllAuditLogs();
        if (recentLogs.size() > 5) {
            recentLogs = recentLogs.subList(0, 5);
        }

        Map<String, Object> ragStatus = adminRagService.getRagStatus();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchemes", total);
        stats.put("publishedSchemes", published);
        stats.put("draftSchemes", draft);
        stats.put("inactiveSchemes", inactive);
        stats.put("totalCategories", categories.size());
        stats.put("totalDepartments", departments.size());
        stats.put("recentChanges", recentLogs);
        stats.put("ragStatus", ragStatus);
        return stats;
    }

    public Map<String, Object> getSchemes(String status, String category, String department, String state, String search, int page, int size) {
        List<Scheme> list = schemeRepository.findAll();

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(s -> status.equalsIgnoreCase(s.getStatus())).collect(Collectors.toList());
        }
        if (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category)) {
            list = list.stream().filter(s -> category.equalsIgnoreCase(s.getCategory())).collect(Collectors.toList());
        }
        if (department != null && !department.trim().isEmpty() && !"ALL".equalsIgnoreCase(department)) {
            list = list.stream().filter(s -> department.equalsIgnoreCase(s.getDepartment())).collect(Collectors.toList());
        }
        if (state != null && !state.trim().isEmpty() && !"ALL".equalsIgnoreCase(state)) {
            list = list.stream().filter(s -> state.equalsIgnoreCase(s.getState())).collect(Collectors.toList());
        }
        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            list = list.stream().filter(s -> 
                (s.getName() != null && s.getName().toLowerCase().contains(q)) ||
                (s.getDepartment() != null && s.getDepartment().toLowerCase().contains(q)) ||
                (s.getCategory() != null && s.getCategory().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        // Sort by updatedAt desc
        list.sort((a, b) -> {
            if (a.getUpdatedAt() == null) return 1;
            if (b.getUpdatedAt() == null) return -1;
            return b.getUpdatedAt().compareTo(a.getUpdatedAt());
        });

        int totalElements = list.size();
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Scheme> pageContent = list.subList(fromIndex, toIndex);

        // Attach requirement counts
        List<Map<String, Object>> contentWithDetails = new ArrayList<>();
        for (Scheme s : pageContent) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("name", s.getName());
            item.put("department", s.getDepartment());
            item.put("category", s.getCategory());
            item.put("state", s.getState());
            item.put("status", s.getStatus() != null ? s.getStatus() : "PUBLISHED");
            item.put("version", s.getVersion() != null ? s.getVersion() : 1);
            item.put("updatedAt", s.getUpdatedAt());
            item.put("rulesCount", requirementRepository.findBySchemeId(s.getId()).size());
            contentWithDetails.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("content", contentWithDetails);
        result.put("totalElements", totalElements);
        result.put("totalPages", (int) Math.ceil((double) totalElements / size));
        result.put("currentPage", page);
        result.put("pageSize", size);
        return result;
    }

    public SchemeDTO getSchemeDetails(Long id) {
        Scheme s = schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheme not found with ID: " + id));

        SchemeDTO dto = new SchemeDTO();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDepartment(s.getDepartment());
        dto.setDescription(s.getDescription());
        dto.setShortDescription(s.getShortDescription());
        dto.setBenefits(s.getBenefits());
        dto.setCategory(s.getCategory());
        dto.setBeneficiaryType(s.getBeneficiaryType());
        dto.setTargetBeneficiary(s.getTargetBeneficiary());
        dto.setSchemeType(s.getSchemeType());
        dto.setState(s.getState());
        dto.setApplicationProcess(s.getApplicationProcess());
        dto.setRequiredDocuments(s.getRequiredDocuments());
        dto.setDeadline(s.getDeadline());
        dto.setOfficialUrl(s.getOfficialUrl());
        dto.setImageUrl(s.getImageUrl());
        dto.setStatus(s.getStatus() != null ? s.getStatus() : "PUBLISHED");
        dto.setVersion(s.getVersion() != null ? s.getVersion() : 1);
        dto.setTagsKeywords(s.getTagsKeywords());
        dto.setOfficialSchemeId(s.getOfficialSchemeId());

        dto.setRequirements(requirementRepository.findBySchemeId(id));
        dto.setBenefitsList(benefitRepository.findBySchemeId(id));
        dto.setDocumentsList(documentRepository.findBySchemeId(id));
        dto.setApplicationSteps(stepRepository.findBySchemeIdOrderByStepNumberAsc(id));
        dto.setFaqs(faqRepository.findBySchemeIdOrderByDisplayOrderAsc(id));
        dto.setSources(sourceRepository.findBySchemeId(id));

        return dto;
    }

    @Transactional
    public SchemeDTO createScheme(SchemeDTO dto, String adminEmail) {
        Scheme s = Scheme.builder()
                .name(dto.getName())
                .department(dto.getDepartment())
                .description(dto.getDescription())
                .shortDescription(dto.getShortDescription())
                .benefits(dto.getBenefits())
                .category(dto.getCategory())
                .beneficiaryType(dto.getBeneficiaryType())
                .targetBeneficiary(dto.getTargetBeneficiary())
                .schemeType(dto.getSchemeType())
                .state(dto.getState())
                .applicationProcess(dto.getApplicationProcess())
                .requiredDocuments(dto.getRequiredDocuments())
                .deadline(dto.getDeadline())
                .officialUrl(dto.getOfficialUrl())
                .imageUrl(dto.getImageUrl())
                .status(dto.getStatus() != null ? dto.getStatus() : "DRAFT")
                .version(1)
                .tagsKeywords(dto.getTagsKeywords())
                .officialSchemeId(dto.getOfficialSchemeId())
                .createdBy(adminEmail)
                .updatedBy(adminEmail)
                .build();

        Scheme saved = schemeRepository.save(s);
        saveSubEntities(saved.getId(), dto);

        auditLogService.log(adminEmail, "CREATE", "SCHEME", saved.getId(), "Created scheme: " + saved.getName() + " [Status: " + saved.getStatus() + "]");

        if ("PUBLISHED".equalsIgnoreCase(saved.getStatus())) {
            adminRagService.reindexSingleScheme(saved.getId());
        }

        return getSchemeDetails(saved.getId());
    }

    @Transactional
    public SchemeDTO updateScheme(Long id, SchemeDTO dto, String adminEmail) {
        Scheme s = schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheme not found with ID: " + id));

        boolean wasPublished = "PUBLISHED".equalsIgnoreCase(s.getStatus());
        String newStatus = dto.getStatus() != null ? dto.getStatus() : s.getStatus();
        boolean isPublishing = "PUBLISHED".equalsIgnoreCase(newStatus);

        s.setName(dto.getName());
        s.setDepartment(dto.getDepartment());
        s.setDescription(dto.getDescription());
        s.setShortDescription(dto.getShortDescription());
        s.setBenefits(dto.getBenefits());
        s.setCategory(dto.getCategory());
        s.setBeneficiaryType(dto.getBeneficiaryType());
        s.setTargetBeneficiary(dto.getTargetBeneficiary());
        s.setSchemeType(dto.getSchemeType());
        s.setState(dto.getState());
        s.setApplicationProcess(dto.getApplicationProcess());
        s.setRequiredDocuments(dto.getRequiredDocuments());
        s.setDeadline(dto.getDeadline());
        s.setOfficialUrl(dto.getOfficialUrl());
        s.setImageUrl(dto.getImageUrl());
        s.setStatus(newStatus);
        s.setTagsKeywords(dto.getTagsKeywords());
        s.setOfficialSchemeId(dto.getOfficialSchemeId());
        s.setUpdatedBy(adminEmail);

        if (wasPublished || isPublishing) {
            s.setVersion((s.getVersion() != null ? s.getVersion() : 1) + 1);
        }

        Scheme updated = schemeRepository.save(s);
        saveSubEntities(updated.getId(), dto);

        auditLogService.log(adminEmail, "UPDATE", "SCHEME", updated.getId(), "Updated scheme: " + updated.getName() + " (v" + updated.getVersion() + ")");

        if (isPublishing) {
            adminRagService.reindexSingleScheme(updated.getId());
        } else {
            adminRagService.removeSchemeFromRag(updated.getId());
        }

        return getSchemeDetails(updated.getId());
    }

    private final SchemeVersionRepository versionRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Transactional
    public SchemeDTO publishScheme(Long id, String adminEmail) {
        Scheme s = schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheme not found with ID: " + id));

        validateForPublish(id);

        s.setStatus("PUBLISHED");
        int nextVer = (s.getVersion() != null ? s.getVersion() : 1) + 1;
        s.setVersion(nextVer);
        s.setUpdatedBy(adminEmail);

        Scheme saved = schemeRepository.save(s);
        saveVersionSnapshot(saved, adminEmail, "Published scheme version " + nextVer);

        auditLogService.log(adminEmail, "PUBLISH", "SCHEME", saved.getId(), "Published scheme: " + saved.getName() + " (v" + nextVer + ")");

        adminRagService.reindexSingleScheme(saved.getId());
        return getSchemeDetails(saved.getId());
    }

    @Transactional
    public SchemeDTO deactivateScheme(Long id, String adminEmail) {
        Scheme s = schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheme not found with ID: " + id));

        s.setStatus("INACTIVE");
        s.setUpdatedBy(adminEmail);

        Scheme saved = schemeRepository.save(s);
        auditLogService.log(adminEmail, "DEACTIVATE", "SCHEME", saved.getId(), "Deactivated scheme: " + saved.getName());

        adminRagService.removeSchemeFromRag(saved.getId());
        return getSchemeDetails(saved.getId());
    }

    @Transactional
    public SchemeDTO duplicateScheme(Long id, String adminEmail) {
        SchemeDTO source = getSchemeDetails(id);
        source.setId(null);
        source.setName(source.getName() + " (Copy)");
        source.setStatus("DRAFT");
        source.setOfficialSchemeId(null);
        return createScheme(source, adminEmail);
    }

    @Transactional
    public void deleteScheme(Long id, String adminEmail) {
        Scheme s = schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheme not found with ID: " + id));

        s.setStatus("INACTIVE");
        schemeRepository.save(s);

        auditLogService.log(adminEmail, "DELETE", "SCHEME", id, "Deactivated/Soft-deleted scheme: " + s.getName());
        adminRagService.removeSchemeFromRag(id);
    }

    public EligibilityResult testEligibility(Long schemeId, DataWallet sampleWallet) {
        return scoringEngineService.calculateEligibility(0L, schemeId, sampleWallet);
    }

    public List<SchemeVersion> getVersionHistory(Long schemeId) {
        return versionRepository.findBySchemeIdOrderByVersionNumberDesc(schemeId);
    }

    @Transactional
    public SchemeDTO rollbackToVersion(Long schemeId, Integer versionNumber, String adminEmail) {
        SchemeVersion sv = versionRepository.findBySchemeIdAndVersionNumber(schemeId, versionNumber)
                .orElseThrow(() -> new RuntimeException("Version " + versionNumber + " not found for scheme " + schemeId));

        try {
            SchemeDTO snapshot = objectMapper.readValue(sv.getSchemeDataJson(), SchemeDTO.class);
            snapshot.setVersion(snapshot.getVersion() + 1);
            snapshot.setStatus("DRAFT");
            
            SchemeDTO restored = updateScheme(schemeId, snapshot, adminEmail);
            auditLogService.log(adminEmail, "ROLLBACK", "SCHEME", schemeId, "Rolled back scheme to version " + versionNumber);
            return restored;
        } catch (Exception e) {
            log.error("Failed to restore scheme snapshot for version {}", versionNumber, e);
            throw new RuntimeException("Failed to restore scheme version snapshot: " + e.getMessage());
        }
    }

    public com.schemewise.backend.dto.RuleTestResultDTO testEligibilityDetailed(com.schemewise.backend.dto.RuleTestRequestDTO request) {
        List<SchemeRequirement> reqs = request.getRequirements();
        if ((reqs == null || reqs.isEmpty()) && request.getSchemeId() != null) {
            reqs = requirementRepository.findBySchemeId(request.getSchemeId());
        }
        return scoringEngineService.testRequirements(reqs, request.getTestWallet());
    }

    public Map<String, Object> validateForPublish(Long id) {
        SchemeDTO dto = getSchemeDetails(id);
        List<String> issues = new ArrayList<>();

        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            issues.add("Scheme name is required.");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            issues.add("Scheme description is required.");
        }
        if (dto.getCategory() == null || dto.getCategory().trim().isEmpty()) {
            issues.add("Scheme category is required.");
        }
        if (dto.getRequirements() == null || dto.getRequirements().isEmpty()) {
            issues.add("Scheme must have at least one eligibility rule.");
        } else {
            for (int i = 0; i < dto.getRequirements().size(); i++) {
                SchemeRequirement r = dto.getRequirements().get(i);
                if (r.getFieldName() == null || r.getFieldName().trim().isEmpty()) {
                    issues.add("Rule #" + (i + 1) + " has an unspecified field.");
                }
                if (r.getOperator() == null || r.getOperator().trim().isEmpty()) {
                    issues.add("Rule #" + (i + 1) + " has an unspecified operator.");
                }
                if (r.getRequiredValue() == null || r.getRequiredValue().trim().isEmpty()) {
                    issues.add("Rule #" + (i + 1) + " has an unspecified comparison value.");
                }
            }
        }

        if (dto.getOfficialUrl() != null && !dto.getOfficialUrl().trim().isEmpty() &&
            !dto.getOfficialUrl().startsWith("http://") && !dto.getOfficialUrl().startsWith("https://")) {
            issues.add("Official URL must start with http:// or https://");
        }

        Map<String, Object> validation = new HashMap<>();
        validation.put("valid", issues.isEmpty());
        validation.put("issues", issues);
        if (!issues.isEmpty()) {
            throw new IllegalArgumentException("Cannot publish scheme. Validation failed: " + String.join("; ", issues));
        }
        return validation;
    }

    private void saveVersionSnapshot(Scheme scheme, String adminEmail, String summary) {
        try {
            SchemeDTO fullDto = getSchemeDetails(scheme.getId());
            String json = objectMapper.writeValueAsString(fullDto);
            SchemeVersion ver = SchemeVersion.builder()
                    .schemeId(scheme.getId())
                    .versionNumber(scheme.getVersion() != null ? scheme.getVersion() : 1)
                    .changedBy(adminEmail)
                    .changeSummary(summary)
                    .schemeDataJson(json)
                    .build();
            versionRepository.save(ver);
        } catch (Exception e) {
            log.warn("Could not save version snapshot for scheme {}: {}", scheme.getId(), e.getMessage());
        }
    }

    private void saveSubEntities(Long schemeId, SchemeDTO dto) {
        // Requirements
        requirementRepository.deleteBySchemeId(schemeId);
        if (dto.getRequirements() != null) {
            for (int i = 0; i < dto.getRequirements().size(); i++) {
                SchemeRequirement r = dto.getRequirements().get(i);
                if (r == null) continue;
                r.setId(null);
                r.setSchemeId(schemeId);
                if (r.getFieldName() == null || r.getFieldName().trim().isEmpty()) {
                    r.setFieldName("income");
                }
                if (r.getOperator() == null || r.getOperator().trim().isEmpty()) {
                    r.setOperator("<=");
                }
                if (r.getRequiredValue() == null || r.getRequiredValue().trim().isEmpty()) {
                    r.setRequiredValue("250000");
                }
                if (r.getMandatory() == null) {
                    r.setMandatory(true);
                }
                if (r.getWeight() == null) {
                    r.setWeight(20.0);
                }
                if (r.getConditionOrder() == null) {
                    r.setConditionOrder(i + 1);
                }
                requirementRepository.save(r);
            }
        }

        // Benefits
        benefitRepository.deleteBySchemeId(schemeId);
        if (dto.getBenefitsList() != null) {
            for (SchemeBenefit b : dto.getBenefitsList()) {
                if (b == null) continue;
                b.setId(null);
                b.setSchemeId(schemeId);
                if (b.getTitle() == null || b.getTitle().trim().isEmpty()) {
                    b.setTitle("General Benefit");
                }
                benefitRepository.save(b);
            }
        }

        // Documents
        documentRepository.deleteBySchemeId(schemeId);
        if (dto.getDocumentsList() != null) {
            for (SchemeDocument d : dto.getDocumentsList()) {
                if (d == null) continue;
                d.setId(null);
                d.setSchemeId(schemeId);
                if (d.getName() == null || d.getName().trim().isEmpty()) {
                    d.setName("Identity Proof");
                }
                if (d.getMandatory() == null) {
                    d.setMandatory(true);
                }
                documentRepository.save(d);
            }
        }

        // Steps
        stepRepository.deleteBySchemeId(schemeId);
        if (dto.getApplicationSteps() != null) {
            for (int i = 0; i < dto.getApplicationSteps().size(); i++) {
                SchemeApplicationStep step = dto.getApplicationSteps().get(i);
                if (step == null) continue;
                step.setId(null);
                step.setSchemeId(schemeId);
                if (step.getStepNumber() == null) {
                    step.setStepNumber(i + 1);
                }
                stepRepository.save(step);
            }
        }

        // FAQs
        faqRepository.deleteBySchemeId(schemeId);
        if (dto.getFaqs() != null) {
            for (int i = 0; i < dto.getFaqs().size(); i++) {
                SchemeFAQ faq = dto.getFaqs().get(i);
                if (faq == null) continue;
                faq.setId(null);
                faq.setSchemeId(schemeId);
                if (faq.getQuestion() == null || faq.getQuestion().trim().isEmpty()) {
                    faq.setQuestion("General Inquiry");
                }
                if (faq.getAnswer() == null || faq.getAnswer().trim().isEmpty()) {
                    faq.setAnswer("Please refer to official guidelines.");
                }
                if (faq.getDisplayOrder() == null) {
                    faq.setDisplayOrder(i + 1);
                }
                faqRepository.save(faq);
            }
        }

        // Sources
        sourceRepository.deleteBySchemeId(schemeId);
        if (dto.getSources() != null) {
            for (SchemeSource src : dto.getSources()) {
                if (src == null) continue;
                src.setId(null);
                src.setSchemeId(schemeId);
                if (src.getSourceName() == null || src.getSourceName().trim().isEmpty()) {
                    src.setSourceName("Official Government Portal");
                }
                sourceRepository.save(src);
            }
        }
    }
}
