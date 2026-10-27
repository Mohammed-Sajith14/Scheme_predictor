package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchemeDocumentRepository extends JpaRepository<SchemeDocument, Long> {
    List<SchemeDocument> findBySchemeId(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
