package com.schemewise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleTestResultDTO {

    private Double coverageScore;
    private Double ruleMatchScore;
    private Double mlScore;
    private Double overallScore;
    private String status;
    private String missingFields;
    private List<RuleEvaluationItem> ruleEvaluations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RuleEvaluationItem {
        private String fieldName;
        private String fieldLabel;
        private String operator;
        private String requiredValue;
        private Object actualValue;
        private Boolean satisfied;
        private Boolean mandatory;
        private Double weight;
        private String logicalGroup;
    }
}
