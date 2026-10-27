package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;
    
    @Column(nullable = false)
    private String status; // SAVED, STARTED, SUBMITTED, VERIFYING, APPROVED, REJECTED
    
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
