package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchemeBenefitRepository extends JpaRepository<SchemeBenefit, Long> {
    List<SchemeBenefit> findBySchemeId(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
