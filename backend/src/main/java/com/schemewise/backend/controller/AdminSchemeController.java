package com.schemewise.backend.controller;

import com.schemewise.backend.dto.SchemeDTO;
import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.model.EligibilityResult;
import com.schemewise.backend.service.AdminSchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminSchemeController {

    private final AdminSchemeService adminSchemeService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(adminSchemeService.getDashboardStats());
    }

    @GetMapping("/schemes")
    public ResponseEntity<?> getSchemes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(adminSchemeService.getSchemes(status, category, department, state, search, page, size));
    }

    @GetMapping("/schemes/{id}")
    public ResponseEntity<?> getSchemeDetails(@PathVariable Long id) {
        return ResponseEntity.ok(adminSchemeService.getSchemeDetails(id));
    }

    @PostMapping("/schemes")
    public ResponseEntity<?> createScheme(@RequestBody SchemeDTO dto, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.createScheme(dto, adminEmail));
    }

    @PutMapping("/schemes/{id}")
    public ResponseEntity<?> updateScheme(@PathVariable Long id, @RequestBody SchemeDTO dto, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.updateScheme(id, dto, adminEmail));
    }

    @PostMapping("/schemes/{id}/publish")
    public ResponseEntity<?> publishScheme(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.publishScheme(id, adminEmail));
    }

    @PostMapping("/schemes/{id}/deactivate")
    public ResponseEntity<?> deactivateScheme(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.deactivateScheme(id, adminEmail));
    }

    @PostMapping("/schemes/{id}/duplicate")
    public ResponseEntity<?> duplicateScheme(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.duplicateScheme(id, adminEmail));
    }

    @DeleteMapping("/schemes/{id}")
    public ResponseEntity<?> deleteScheme(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        adminSchemeService.deleteScheme(id, adminEmail);
        return ResponseEntity.ok(Map.of("message", "Scheme deactivated successfully."));
    }

    @PostMapping("/schemes/{id}/test-eligibility")
    public ResponseEntity<?> testEligibility(@PathVariable Long id, @RequestBody DataWallet sampleWallet) {
        EligibilityResult result = adminSchemeService.testEligibility(id, sampleWallet);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/schemes/test-rule-detailed")
    public ResponseEntity<?> testEligibilityDetailed(@RequestBody com.schemewise.backend.dto.RuleTestRequestDTO request) {
        return ResponseEntity.ok(adminSchemeService.testEligibilityDetailed(request));
    }

    @GetMapping("/schemes/{id}/versions")
    public ResponseEntity<?> getVersionHistory(@PathVariable Long id) {
        return ResponseEntity.ok(adminSchemeService.getVersionHistory(id));
    }

    @PostMapping("/schemes/{id}/rollback/{versionNumber}")
    public ResponseEntity<?> rollbackToVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        return ResponseEntity.ok(adminSchemeService.rollbackToVersion(id, versionNumber, adminEmail));
    }

    @GetMapping("/schemes/{id}/validate")
    public ResponseEntity<?> validateForPublish(@PathVariable Long id) {
        return ResponseEntity.ok(adminSchemeService.validateForPublish(id));
    }
}
