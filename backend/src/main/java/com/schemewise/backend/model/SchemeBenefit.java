package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_benefits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeBenefit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    private String title;

    @Column(length = 2000)
    private String description;

    private String amount;

    private String frequency; // One-time, Monthly, Annual, Recurring
}
