package com.schemewise.backend.service;

import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.model.EligibilityResult;
import com.schemewise.backend.model.SavedScheme;
import com.schemewise.backend.model.Scheme;
import com.schemewise.backend.repository.EligibilityResultRepository;
import com.schemewise.backend.repository.SavedSchemeRepository;
import com.schemewise.backend.repository.SchemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchemeService {

    private final SchemeRepository schemeRepository;
    private final SavedSchemeRepository savedSchemeRepository;
    private final EligibilityResultRepository eligibilityResultRepository;
    private final ScoringEngineService scoringEngineService;

    public List<Scheme> getAllSchemes() {
        return schemeRepository.findAll().stream()
                .filter(s -> s.getStatus() == null || "PUBLISHED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());
    }

    public Optional<Scheme> getSchemeById(Long id) {
        return schemeRepository.findById(id)
                .filter(s -> s.getStatus() == null || "PUBLISHED".equalsIgnoreCase(s.getStatus()));
    }

    @Transactional
    public void recalculateAllEligibility(Long userId, DataWallet wallet) {
        List<Scheme> schemes = getAllSchemes();
        for (Scheme scheme : schemes) {
            EligibilityResult res = scoringEngineService.calculateEligibility(userId, scheme.getId(), wallet);
            
            Optional<EligibilityResult> existing = eligibilityResultRepository.findByUserIdAndSchemeId(userId, scheme.getId());
            if (existing.isPresent()) {
                EligibilityResult current = existing.get();
                current.setCoverageScore(res.getCoverageScore());
                current.setRuleMatchScore(res.getRuleMatchScore());
                current.setMlScore(res.getMlScore());
                current.setOverallScore(res.getOverallScore());
                current.setStatus(res.getStatus());
                current.setMissingFields(res.getMissingFields());
                current.setFailedRules(res.getFailedRules());
                eligibilityResultRepository.save(current);
            } else {
                eligibilityResultRepository.save(res);
            }
        }
    }

    public List<Map<String, Object>> getRankedEligibilityResults(Long userId, DataWallet wallet) {
        // Recalculate to guarantee fresh evaluation against current wallet and scheme requirements
        recalculateAllEligibility(userId, wallet);
        List<EligibilityResult> results = eligibilityResultRepository.findByUserId(userId);

        List<Scheme> schemes = schemeRepository.findAll();
        Map<Long, Scheme> schemeMap = schemes.stream().collect(Collectors.toMap(Scheme::getId, s -> s));

        List<Map<String, Object>> list = new ArrayList<>();
        for (EligibilityResult res : results) {
            Scheme s = schemeMap.get(res.getSchemeId());
            if (s != null) {
                Map<String, Object> map = new HashMap<>();
                map.put("schemeId", s.getId());
                map.put("name", s.getName());
                map.put("department", s.getDepartment());
                map.put("description", s.getDescription());
                map.put("benefits", s.getBenefits());
                map.put("category", s.getCategory());
                map.put("officialUrl", s.getOfficialUrl());
                map.put("imageUrl", s.getImageUrl());
                map.put("deadline", s.getDeadline());
                
                map.put("coverageScore", res.getCoverageScore());
                map.put("ruleMatchScore", res.getRuleMatchScore());
                map.put("mlScore", res.getMlScore());
                map.put("overallScore", res.getOverallScore());
                map.put("status", res.getStatus());
                map.put("missingFields", res.getMissingFields() != null && !res.getMissingFields().isEmpty() 
                        ? Arrays.asList(res.getMissingFields().split(",")) 
                        : Collections.emptyList());
                map.put("failedRules", res.getFailedRules() != null && !res.getFailedRules().isEmpty()
                        ? Arrays.asList(res.getFailedRules().split(" \\| "))
                        : Collections.emptyList());
                
                boolean isSaved = savedSchemeRepository.existsByUserIdAndSchemeId(userId, s.getId());
                map.put("saved", isSaved);
                
                list.add(map);
            }
        }

        // Sort by priority logic:
        // 1. Highly Eligible -> 2. Likely Eligible -> 3. Potential Match -> 4. Information Needed -> 5. Not Eligible
        list.sort((a, b) -> {
            String statusA = (String) a.get("status");
            String statusB = (String) b.get("status");
            
            int prioA = getStatusPriority(statusA);
            int prioB = getStatusPriority(statusB);
            
            if (prioA != prioB) {
                return Integer.compare(prioA, prioB);
            }
            
            // Tie-breaker:
            // For INFORMATION_NEEDED: sort by coverageScore descending (higher coverage = more promising)
            if ("INFORMATION_NEEDED".equalsIgnoreCase(statusA)) {
                Double covA = (Double) a.get("coverageScore");
                Double covB = (Double) b.get("coverageScore");
                return Double.compare(covB != null ? covB : 0.0, covA != null ? covA : 0.0);
            }

            // For evaluated schemes: sort by overallScore descending
            Double scoreA = (Double) a.get("overallScore");
            Double scoreB = (Double) b.get("overallScore");
            return Double.compare(scoreB != null ? scoreB : 0.0, scoreA != null ? scoreA : 0.0);
        });

        return list;
    }

    private int getStatusPriority(String status) {
        if (status == null) return 6;
        switch (status) {
            case "HIGHLY_ELIGIBLE": return 1;
            case "LIKELY_ELIGIBLE": return 2;
            case "POTENTIAL_MATCH": return 3;
            case "INFORMATION_NEEDED":
            case "MORE_INFORMATION_NEEDED": return 4;
            case "NOT_ELIGIBLE": return 5;
            default: return 6;
        }
    }

    @Transactional
    public void saveScheme(Long userId, Long schemeId) {
        if (!savedSchemeRepository.existsByUserIdAndSchemeId(userId, schemeId)) {
            savedSchemeRepository.save(SavedScheme.builder()
                    .userId(userId)
                    .schemeId(schemeId)
                    .build());
        }
    }

    @Transactional
    public void unsaveScheme(Long userId, Long schemeId) {
        savedSchemeRepository.findByUserIdAndSchemeId(userId, schemeId)
                .ifPresent(savedSchemeRepository::delete);
    }

    public List<Scheme> getSavedSchemesForUser(Long userId) {
        List<SavedScheme> saved = savedSchemeRepository.findByUserId(userId);
        List<Long> ids = saved.stream().map(SavedScheme::getSchemeId).collect(Collectors.toList());
        return schemeRepository.findAllById(ids);
    }
}
