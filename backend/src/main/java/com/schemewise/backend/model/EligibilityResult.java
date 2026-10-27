package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "eligibility_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;
    
    @Column(name = "coverage_score")
    private Double coverageScore;
    
    @Column(name = "rule_match_score")
    private Double ruleMatchScore;
    
    @Column(name = "ml_score")
    private Double mlScore;
    
    @Column(name = "overall_score")
    private Double overallScore;
    
    private String status; // Highly Eligible, Likely Eligible, Potential Match, More Information Needed, Not Eligible
    
    @Column(name = "missing_fields", length = 1000)
    private String missingFields; // Comma-separated list of missing fields

    @Column(name = "failed_rules", length = 1000)
    private String failedRules; // Explanation of failed mandatory rules
    
    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;
    
    @PrePersist
    @PreUpdate
    protected void onCalculate() {
        calculatedAt = LocalDateTime.now();
    }
}
