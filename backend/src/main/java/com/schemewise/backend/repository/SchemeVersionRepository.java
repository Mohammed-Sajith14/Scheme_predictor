package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchemeVersionRepository extends JpaRepository<SchemeVersion, Long> {
    List<SchemeVersion> findBySchemeIdOrderByVersionNumberDesc(Long schemeId);
    Optional<SchemeVersion> findBySchemeIdAndVersionNumber(Long schemeId, Integer versionNumber);
}
