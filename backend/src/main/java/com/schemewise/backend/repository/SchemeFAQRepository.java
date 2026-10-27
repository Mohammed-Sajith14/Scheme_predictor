package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeFAQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchemeFAQRepository extends JpaRepository<SchemeFAQ, Long> {
    List<SchemeFAQ> findBySchemeIdOrderByDisplayOrderAsc(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
