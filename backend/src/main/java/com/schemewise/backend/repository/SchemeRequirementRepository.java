package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SchemeRequirementRepository extends JpaRepository<SchemeRequirement, Long> {
    List<SchemeRequirement> findBySchemeId(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
