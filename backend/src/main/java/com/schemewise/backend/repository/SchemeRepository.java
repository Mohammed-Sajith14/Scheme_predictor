package com.schemewise.backend.repository;

import com.schemewise.backend.model.Scheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, Long> {
    List<Scheme> findByStateOrStateIsNull(String state);
    List<Scheme> findByStatus(String status);
    List<Scheme> findByStatusIn(List<String> statuses);
    long countByStatus(String status);
}
