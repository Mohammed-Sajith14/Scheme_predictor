package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_requirements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;
    
    @Column(name = "field_name", nullable = false)
    private String fieldName; // e.g., "income", "age", "studentStatus"
    
    @Column(name = "field_label")
    private String fieldLabel;

    @Column(name = "data_type")
    private String dataType; // NUMBER, BOOLEAN, TEXT, SELECT

    @Column(nullable = false)
    private String operator; // e.g., "<", ">", "==", "IN", "YES", "NO"
    
    @Column(name = "required_value", nullable = false)
    private String requiredValue; // e.g., "250000" or "Tamil Nadu"
    
    private Boolean mandatory;
    private Double weight;

    @Column(name = "logical_group")
    private String logicalGroup;

    @Column(name = "condition_order")
    private Integer conditionOrder;

    @Column(name = "parent_group_id")
    private String parentGroupId;

    @Column(name = "depends_on_field")
    private String dependsOnField;

    @Column(name = "depends_on_value")
    private String dependsOnValue;

    @Column(name = "question_text")
    private String questionText;

    @Column(name = "help_text")
    private String helpText;

    @Column(name = "options_csv")
    private String optionsCsv;

    @Column(name = "unit")
    private String unit;
}
