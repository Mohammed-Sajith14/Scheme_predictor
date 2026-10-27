package com.schemewise.backend.service;

import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.model.SchemeRequirement;
import com.schemewise.backend.model.EligibilityResult;
import com.schemewise.backend.repository.SchemeRequirementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringEngineService {

    private final SchemeRequirementRepository requirementRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public EligibilityResult calculateEligibility(Long userId, Long schemeId, DataWallet wallet) {
        List<SchemeRequirement> requirements = requirementRepository.findBySchemeId(schemeId);
        
        if (requirements.isEmpty()) {
            return EligibilityResult.builder()
                    .userId(userId)
                    .schemeId(schemeId)
                    .coverageScore(100.0)
                    .ruleMatchScore(100.0)
                    .mlScore(100.0)
                    .overallScore(100.0)
                    .status("HIGHLY_ELIGIBLE")
                    .missingFields("")
                    .failedRules("")
                    .build();
        }

        // Filter applicable requirements based on conditional dependencies
        List<SchemeRequirement> activeRequirements = requirements.stream()
                .filter(req -> isRequirementApplicable(req, wallet))
                .collect(Collectors.toList());

        if (activeRequirements.isEmpty()) {
            return EligibilityResult.builder()
                    .userId(userId)
                    .schemeId(schemeId)
                    .coverageScore(100.0)
                    .ruleMatchScore(100.0)
                    .mlScore(100.0)
                    .overallScore(100.0)
                    .status("HIGHLY_ELIGIBLE")
                    .missingFields("")
                    .failedRules("")
                    .build();
        }

        int totalRequired = activeRequirements.size();
        int presentCount = 0;
        int matchedCount = 0;
        boolean violatedMandatory = false;
        List<String> missingFields = new ArrayList<>();
        List<String> failedRuleDescriptions = new ArrayList<>();

        for (SchemeRequirement req : activeRequirements) {
            Object val = getWalletValue(wallet, req.getFieldName());
            if (val == null || val.toString().trim().isEmpty()) {
                missingFields.add(req.getFieldName());
            } else {
                presentCount++;
                boolean isMatch = evaluateRequirement(val, req);
                if (isMatch) {
                    matchedCount++;
                } else {
                    boolean isMandatory = req.getMandatory() == null || Boolean.TRUE.equals(req.getMandatory());
                    if (isMandatory) {
                        violatedMandatory = true;
                    }
                    String label = req.getFieldLabel() != null && !req.getFieldLabel().trim().isEmpty() ? req.getFieldLabel() : req.getFieldName();
                    String op = req.getOperator() != null ? req.getOperator() : "==";
                    String reqVal = req.getRequiredValue() != null ? req.getRequiredValue() : "";
                    String reason = label + " requirement: " + op + " " + reqVal + " (Your " + label + ": " + val + ")";
                    failedRuleDescriptions.add(reason);
                }
            }
        }

        double coverageScore = totalRequired > 0 ? (presentCount * 100.0 / totalRequired) : 100.0;
        double ruleMatchScore = presentCount > 0 ? (matchedCount * 100.0 / presentCount) : 100.0;

        String status;
        Double overallScore = null;
        Double mlScore = null;

        if (violatedMandatory) {
            overallScore = 0.0;
            mlScore = 0.0;
            status = "NOT_ELIGIBLE";
        } else if (!missingFields.isEmpty()) {
            status = "INFORMATION_NEEDED";
            overallScore = null; // Do NOT set fake 0 score when info is missing
            mlScore = null;
        } else {
            mlScore = getMlScore(wallet, activeRequirements, coverageScore, ruleMatchScore);
            overallScore = (0.50 * ruleMatchScore) + (0.50 * mlScore);
            if (overallScore >= 80.0) {
                status = "HIGHLY_ELIGIBLE";
            } else if (overallScore >= 60.0) {
                status = "LIKELY_ELIGIBLE";
            } else if (overallScore >= 40.0) {
                status = "POTENTIAL_MATCH";
            } else {
                status = "NOT_ELIGIBLE";
            }
        }

        return EligibilityResult.builder()
                .userId(userId)
                .schemeId(schemeId)
                .coverageScore(coverageScore)
                .ruleMatchScore(ruleMatchScore)
                .mlScore(mlScore)
                .overallScore(overallScore)
                .status(status)
                .missingFields(String.join(",", missingFields))
                .failedRules(String.join(" | ", failedRuleDescriptions))
                .build();
    }

    public com.schemewise.backend.dto.RuleTestResultDTO testRequirements(List<SchemeRequirement> requirements, DataWallet wallet) {
        if (requirements == null || requirements.isEmpty()) {
            return com.schemewise.backend.dto.RuleTestResultDTO.builder()
                    .coverageScore(100.0)
                    .ruleMatchScore(100.0)
                    .mlScore(100.0)
                    .overallScore(100.0)
                    .status("HIGHLY_ELIGIBLE")
                    .missingFields("")
                    .ruleEvaluations(Collections.emptyList())
                    .build();
        }

        List<SchemeRequirement> activeRequirements = requirements.stream()
                .filter(req -> isRequirementApplicable(req, wallet))
                .collect(Collectors.toList());

        if (activeRequirements.isEmpty()) {
            return com.schemewise.backend.dto.RuleTestResultDTO.builder()
                    .coverageScore(100.0)
                    .ruleMatchScore(100.0)
                    .mlScore(100.0)
                    .overallScore(100.0)
                    .status("HIGHLY_ELIGIBLE")
                    .missingFields("")
                    .ruleEvaluations(Collections.emptyList())
                    .build();
        }

        int totalRequired = activeRequirements.size();
        int presentCount = 0;
        int matchedCount = 0;
        boolean violatedMandatory = false;
        List<String> missingFields = new ArrayList<>();
        List<com.schemewise.backend.dto.RuleTestResultDTO.RuleEvaluationItem> items = new ArrayList<>();

        for (SchemeRequirement req : activeRequirements) {
            Object val = getWalletValue(wallet, req.getFieldName());
            boolean isPresent = (val != null && !val.toString().trim().isEmpty());
            boolean isMatch = false;

            if (!isPresent) {
                missingFields.add(req.getFieldName());
            } else {
                presentCount++;
                isMatch = evaluateRequirement(val, req);
                if (isMatch) {
                    matchedCount++;
                } else if (Boolean.TRUE.equals(req.getMandatory())) {
                    violatedMandatory = true;
                }
            }

            items.add(com.schemewise.backend.dto.RuleTestResultDTO.RuleEvaluationItem.builder()
                    .fieldName(req.getFieldName())
                    .fieldLabel(req.getFieldLabel() != null ? req.getFieldLabel() : req.getFieldName())
                    .operator(req.getOperator())
                    .requiredValue(req.getRequiredValue())
                    .actualValue(val)
                    .satisfied(isMatch)
                    .mandatory(req.getMandatory())
                    .weight(req.getWeight())
                    .logicalGroup(req.getLogicalGroup())
                    .build());
        }

        double coverageScore = totalRequired > 0 ? (presentCount * 100.0 / totalRequired) : 100.0;
        double ruleMatchScore = presentCount > 0 ? (matchedCount * 100.0 / presentCount) : 100.0;
        double mlScore = getMlScore(wallet, activeRequirements, coverageScore, ruleMatchScore);
        double overallScore = (0.50 * ruleMatchScore) + (0.50 * mlScore);

        String status;
        if (violatedMandatory) {
            overallScore = 0.0;
            status = "NOT_ELIGIBLE";
        } else if (!missingFields.isEmpty()) {
            status = "INFORMATION_NEEDED";
        } else if (overallScore >= 80.0) {
            status = "HIGHLY_ELIGIBLE";
        } else if (overallScore >= 60.0) {
            status = "LIKELY_ELIGIBLE";
        } else if (overallScore >= 40.0) {
            status = "POTENTIAL_MATCH";
        } else {
            status = "NOT_ELIGIBLE";
        }

        return com.schemewise.backend.dto.RuleTestResultDTO.builder()
                .coverageScore(coverageScore)
                .ruleMatchScore(ruleMatchScore)
                .mlScore(mlScore)
                .overallScore(overallScore)
                .status(status)
                .missingFields(String.join(", ", missingFields))
                .ruleEvaluations(items)
                .build();
    }

    private boolean isRequirementApplicable(SchemeRequirement req, DataWallet wallet) {
        if (req == null) return false;
        String depField = req.getDependsOnField();
        String depVal = req.getDependsOnValue();

        if (depField != null && !depField.trim().isEmpty() && depVal != null && !depVal.trim().isEmpty()) {
            Object actualParentVal = getWalletValue(wallet, depField);
            if (actualParentVal == null) return false;

            String actualStr = actualParentVal.toString().trim();
            String reqStr = depVal.trim();
            if (actualParentVal instanceof Boolean || actualStr.equalsIgnoreCase("true") || actualStr.equalsIgnoreCase("false")) {
                boolean actualBool = Boolean.parseBoolean(actualStr) || actualStr.equalsIgnoreCase("yes") || actualStr.equalsIgnoreCase("y");
                boolean reqBool = Boolean.parseBoolean(reqStr) || reqStr.equalsIgnoreCase("yes") || reqStr.equalsIgnoreCase("y");
                return actualBool == reqBool;
            }
            return actualStr.equalsIgnoreCase(reqStr);
        }
        return true;
    }

    private Object getWalletValue(DataWallet wallet, String fieldName) {
        if (wallet == null || fieldName == null) return null;
        
        switch (fieldName.toLowerCase()) {
            case "age":
            case "dateofbirth":
                if (wallet.getDateOfBirth() == null) return null;
                return Period.between(wallet.getDateOfBirth(), LocalDate.now()).getYears();
            case "income":
            case "annualincome":
                return wallet.getIncome();
            case "gender":
                return wallet.getGender();
            case "state":
                return wallet.getState();
            case "district":
                return wallet.getDistrict();
            case "urbanrural":
            case "locationtype":
                return wallet.getUrbanRural();
            case "occupation":
                return wallet.getOccupation();
            case "employmentstatus":
                return wallet.getEmploymentStatus();
            case "education":
            case "educationlevel":
                return wallet.getEducation();
            case "studentstatus":
                return wallet.getStudentStatus();
            case "familysize":
                return wallet.getFamilySize();
            case "maritalstatus":
                return wallet.getMaritalStatus();
            case "farmerstatus":
                return wallet.getFarmerStatus();
            case "landownership":
                return wallet.getLandOwnership();
            case "landarea":
                return wallet.getLandArea();
            case "disabilitystatus":
                return wallet.getDisabilityStatus();
            case "disabilitypercentage":
                return wallet.getDisabilityPercentage();
            case "disabilitycertificatestatus":
                return wallet.getDisabilityCertificateStatus();
            case "housingstatus":
                return wallet.getHousingStatus();
            case "existingbenefits":
                return wallet.getExistingBenefits();
            default:
                return getAdditionalAttributeValue(wallet, fieldName);
        }
    }

    private Object getAdditionalAttributeValue(DataWallet wallet, String fieldName) {
        if (wallet == null || wallet.getAdditionalAttributes() == null || wallet.getAdditionalAttributes().trim().isEmpty()) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> map = mapper.readValue(wallet.getAdditionalAttributes(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(fieldName)) {
                    return entry.getValue();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse additionalAttributes JSON in DataWallet: {}", e.getMessage());
        }
        return null;
    }

    private boolean evaluateRequirement(Object walletVal, SchemeRequirement req) {
        if (walletVal == null || req == null || req.getOperator() == null) return false;
        String op = req.getOperator().toUpperCase();
        String reqValStr = req.getRequiredValue() != null ? req.getRequiredValue() : "";

        try {
            String valStr = walletVal.toString().trim();

            // 1. Boolean Representation
            if ((req.getDataType() != null && req.getDataType().equalsIgnoreCase("BOOLEAN")) || isBooleanLike(valStr) || isBooleanLike(reqValStr)) {
                boolean valBool = parseBooleanLike(valStr);
                boolean reqBool = parseBooleanLike(reqValStr);
                return valBool == reqBool;
            }

            // 2. Numeric Comparison
            if (walletVal instanceof Number || isNumeric(valStr)) {
                if (isNumeric(reqValStr)) {
                    double val = Double.parseDouble(valStr);
                    double reqVal = Double.parseDouble(reqValStr);

                    switch (op) {
                        case "<": return val < reqVal;
                        case ">": return val > reqVal;
                        case "<=": return val <= reqVal;
                        case ">=": return val >= reqVal;
                        case "==":
                        case "EQUALS": return Math.abs(val - reqVal) < 0.0001;
                        case "!=":
                        case "NOT_EQUALS": return Math.abs(val - reqVal) >= 0.0001;
                        default: return false;
                    }
                }
            }

            // 3. String & List Normalization (stripping spaces, hyphens, non-alphanumeric for comparison)
            String normVal = valStr.toLowerCase().replaceAll("[^a-z0-9]", "");
            String normReq = reqValStr.toLowerCase().replaceAll("[^a-z0-9]", "");

            switch (op) {
                case "==":
                case "EQUALS":
                    return normVal.equals(normReq);
                case "!=":
                case "NOT_EQUALS":
                    return !normVal.equals(normReq);
                case "IN":
                    List<String> allowed = Arrays.stream(reqValStr.split(","))
                            .map(s -> s.toLowerCase().replaceAll("[^a-z0-9]", ""))
                            .collect(Collectors.toList());
                    return allowed.contains(normVal);
                case "CONTAINS":
                    return normVal.contains(normReq);
                case "YES":
                    return parseBooleanLike(valStr);
                case "NO":
                    return !parseBooleanLike(valStr);
                default:
                    return valStr.equalsIgnoreCase(reqValStr);
            }
        } catch (Exception e) {
            log.error("Error evaluating rule: field={}, operator={}, requiredValue={}, walletValue={}",
                    req.getFieldName(), req.getOperator(), req.getRequiredValue(), walletVal, e);
            return false;
        }
    }

    private boolean isBooleanLike(String s) {
        if (s == null) return false;
        String t = s.trim().toLowerCase();
        return t.equals("true") || t.equals("false") || t.equals("yes") || t.equals("no") || t.equals("y") || t.equals("n") || t.equals("1") || t.equals("0");
    }

    private boolean parseBooleanLike(String s) {
        if (s == null) return false;
        String t = s.trim().toLowerCase();
        return t.equals("true") || t.equals("yes") || t.equals("y") || t.equals("1") || t.equals("student") || t.equals("enrolled");
    }

    private boolean isNumeric(String str) {
        if (str == null) return false;
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private double getMlScore(DataWallet wallet, List<SchemeRequirement> requirements, double coverage, double ruleMatch) {
        try {
            Map<String, Object> payload = new HashMap<>();
            
            // Map simple features
            payload.put("age", wallet.getDateOfBirth() != null ? Period.between(wallet.getDateOfBirth(), LocalDate.now()).getYears() : null);
            payload.put("income", wallet.getIncome());
            payload.put("student_status", wallet.getStudentStatus());
            payload.put("farmer_status", wallet.getFarmerStatus());
            payload.put("disability_status", wallet.getDisabilityStatus());
            payload.put("coverage", coverage);
            payload.put("rule_match", ruleMatch);

            // Add requirements count
            payload.put("total_requirements", requirements.size());
            
            String endpoint = mlServiceUrl + "/predict";
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(endpoint, payload, Map.class);
            if (response != null && response.containsKey("eligibility_score")) {
                Object scoreObj = response.get("eligibility_score");
                if (scoreObj instanceof Number) {
                    return ((Number) scoreObj).doubleValue() * 100.0;
                }
            }
        } catch (Exception e) {
            log.warn("FastAPI ML service unreachable or failed. Falling back to heuristic score. Error: {}", e.getMessage());
        }
        
        // Fallback: simple heuristic matching
        return ruleMatch * (coverage / 100.0);
    }
}
