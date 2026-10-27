package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_application_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeApplicationStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(name = "step_number")
    private Integer stepNumber;

    private String title;

    @Column(length = 2000)
    private String description;
}
