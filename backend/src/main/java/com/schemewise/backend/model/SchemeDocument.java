package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private Boolean mandatory;
}
