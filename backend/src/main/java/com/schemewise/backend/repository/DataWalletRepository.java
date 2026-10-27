package com.schemewise.backend.repository;

import com.schemewise.backend.model.DataWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DataWalletRepository extends JpaRepository<DataWallet, Long> {
    Optional<DataWallet> findByUserId(Long userId);
}
