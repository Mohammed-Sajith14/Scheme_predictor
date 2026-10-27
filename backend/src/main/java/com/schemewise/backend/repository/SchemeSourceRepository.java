package com.schemewise.backend.repository;

import com.schemewise.backend.model.SchemeSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchemeSourceRepository extends JpaRepository<SchemeSource, Long> {
    List<SchemeSource> findBySchemeId(Long schemeId);
    List<SchemeSource> findBySchemeIdOrderByIdDesc(Long schemeId);
    void deleteBySchemeId(Long schemeId);
}
