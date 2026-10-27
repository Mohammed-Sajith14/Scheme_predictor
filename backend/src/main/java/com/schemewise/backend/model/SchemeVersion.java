package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheme_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @Column(name = "change_summary", length = 1000)
    private String changeSummary;

    @Lob
    @Column(name = "scheme_data_json", columnDefinition = "TEXT")
    private String schemeDataJson;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }
}
