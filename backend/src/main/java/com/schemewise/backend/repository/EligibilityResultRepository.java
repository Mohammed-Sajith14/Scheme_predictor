package com.schemewise.backend.repository;

import com.schemewise.backend.model.EligibilityResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EligibilityResultRepository extends JpaRepository<EligibilityResult, Long> {
    List<EligibilityResult> findByUserId(Long userId);
    Optional<EligibilityResult> findByUserIdAndSchemeId(Long userId, Long schemeId);
    void deleteByUserId(Long userId);
}
