package com.schemewise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_sources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeSource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    @Column(name = "official_url", length = 1000)
    private String officialUrl;

    @Column(name = "document_url", length = 1000)
    private String documentUrl;

    @Column(name = "reference_description", length = 1000)
    private String referenceDescription;

    @Column(name = "source_type")
    private String sourceType; // PDF, Text, Government Portal, etc.

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_path", length = 1000)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;

    @Column(name = "indexing_status")
    @Builder.Default
    private String indexingStatus = "NOT_INDEXED"; // NOT_INDEXED, PENDING, INDEXED, FAILED

    @Column(name = "indexing_error", length = 2000)
    private String indexingError;

    @Column(name = "last_indexed_at")
    private String lastIndexedAt;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;
}
