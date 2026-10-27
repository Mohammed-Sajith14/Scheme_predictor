package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_faqs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeFAQ {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false, length = 3000)
    private String answer;

    @Column(name = "display_order")
    private Integer displayOrder;
}
