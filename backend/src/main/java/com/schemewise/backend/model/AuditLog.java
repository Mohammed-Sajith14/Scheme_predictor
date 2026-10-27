package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id")
    private Long adminUserId;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(nullable = false)
    private String action; // CREATE, UPDATE, PUBLISH, DEACTIVATE, DELETE, REINDEX

    @Column(name = "entity_type")
    private String entityType; // SCHEME, REQUIREMENT, RAG

    @Column(name = "entity_id")
    private Long entityId;

    @Column(length = 2000)
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
