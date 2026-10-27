package com.schemewise.backend.controller;

import com.schemewise.backend.model.UserApplication;
import com.schemewise.backend.model.User;
import com.schemewise.backend.repository.UserApplicationRepository;
import com.schemewise.backend.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final UserApplicationRepository applicationRepository;
    private final UserService userService;

    private Long getUserId(Authentication authentication) {
        if (authentication == null) return null;
        String email = authentication.getName();
        return userService.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getApplications(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        List<UserApplication> apps = applicationRepository.findByUserId(userId);
        return ResponseEntity.ok(apps);
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateApplication(Authentication authentication, @RequestBody UpdateAppRequest request) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        UserApplication app = applicationRepository.findByUserIdAndSchemeId(userId, request.getSchemeId())
                .orElse(UserApplication.builder()
                        .userId(userId)
                        .schemeId(request.getSchemeId())
                        .status("SAVED")
                        .build());
        
        app.setStatus(request.getStatus().toUpperCase());
        UserApplication saved = applicationRepository.save(app);
        return ResponseEntity.ok(saved);
    }

    @Data
    public static class UpdateAppRequest {
        private Long schemeId;
        private String status; // SAVED, STARTED, SUBMITTED, VERIFYING, APPROVED, REJECTED
    }
}
