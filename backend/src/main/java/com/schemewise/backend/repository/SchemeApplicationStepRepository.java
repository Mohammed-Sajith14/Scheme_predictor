package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeApplicationStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchemeApplicationStepRepository extends JpaRepository<SchemeApplicationStep, Long> {
    List<SchemeApplicationStep> findBySchemeIdOrderByStepNumberAsc(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
