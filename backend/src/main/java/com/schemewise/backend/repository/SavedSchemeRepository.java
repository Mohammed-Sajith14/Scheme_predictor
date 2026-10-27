package com.schemewise.backend.repository;

import com.schemewise.backend.model.SavedScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavedSchemeRepository extends JpaRepository<SavedScheme, Long> {
    List<SavedScheme> findByUserId(Long userId);
    Optional<SavedScheme> findByUserIdAndSchemeId(Long userId, Long schemeId);
    boolean existsByUserIdAndSchemeId(Long userId, Long schemeId);
}
