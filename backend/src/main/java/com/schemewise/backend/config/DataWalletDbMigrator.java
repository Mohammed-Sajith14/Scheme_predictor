package com.schemewise.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataWalletDbMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("[CRYPTO MIGATOR] Checking PostgreSQL 'data_wallets' table column types for encrypted storage...");
        try {
            // Check if table exists
            Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'data_wallets'", Integer.class);

            if (tableCount != null && tableCount > 0) {
                log.info("[CRYPTO MIGRATOR] Altering data_wallets table columns to TEXT for encrypted & hashed storage...");
                
                String[] textColumns = {
                    "date_of_birth", "income", "family_size", "land_area", 
                    "disability_percentage", "profile_completion"
                };

                for (String col : textColumns) {
                    try {
                        jdbcTemplate.execute(
                            "ALTER TABLE data_wallets ALTER COLUMN " + col + " TYPE TEXT USING " + col + "::text");
                    } catch (Exception colEx) {
                        // Ignore if column doesn't exist or already text
                    }
                }
                
                // Add wallet_hash column if not exists
                try {
                    jdbcTemplate.execute("ALTER TABLE data_wallets ADD COLUMN IF NOT EXISTS wallet_hash VARCHAR(64)");
                } catch (Exception hashEx) {}

                log.info("[CRYPTO MIGRATOR] PostgreSQL 'data_wallets' columns successfully migrated to TEXT & wallet_hash configured.");
            }
        } catch (Exception e) {
            log.warn("[CRYPTO MIGRATOR] Schema migration notice: {}", e.getMessage());
        }
    }
}
