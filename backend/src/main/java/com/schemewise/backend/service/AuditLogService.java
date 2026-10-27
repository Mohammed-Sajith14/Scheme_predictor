package com.schemewise.backend.service;

import com.schemewise.backend.model.AuditLog;
import com.schemewise.backend.model.User;
import com.schemewise.backend.repository.AuditLogRepository;
import com.schemewise.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(String adminEmail, String action, String entityType, Long entityId, String details) {
        Long adminId = null;
        if (adminEmail != null) {
            Optional<User> u = userRepository.findByEmail(adminEmail);
            if (u.isPresent()) {
                adminId = u.get().getId();
            }
        }

        AuditLog log = AuditLog.builder()
                .adminEmail(adminEmail != null ? adminEmail : "system@schemewise.com")
                .adminUserId(adminId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();

        auditLogRepository.save(log);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
