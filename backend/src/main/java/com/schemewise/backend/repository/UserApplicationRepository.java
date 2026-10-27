package com.schemewise.backend.repository;

import com.schemewise.backend.model.UserApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserApplicationRepository extends JpaRepository<UserApplication, Long> {
    List<UserApplication> findByUserId(Long userId);
    Optional<UserApplication> findByUserIdAndSchemeId(Long userId, Long schemeId);
}
