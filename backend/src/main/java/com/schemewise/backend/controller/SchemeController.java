package com.schemewise.backend.controller;

import com.schemewise.backend.model.*;
import com.schemewise.backend.repository.SavedSchemeRepository;
import com.schemewise.backend.repository.SchemeRequirementRepository;
import com.schemewise.backend.service.DataWalletService;
import com.schemewise.backend.service.SchemeService;
import com.schemewise.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/schemes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SchemeController {

    private final SchemeService schemeService;
    private final UserService userService;
    private final DataWalletService walletService;
    private final SchemeRequirementRepository requirementRepository;
    private final SavedSchemeRepository savedSchemeRepository;
    private final com.schemewise.backend.repository.SchemeApplicationStepRepository stepRepository;

    private Long getUserId(Authentication authentication) {
        if (authentication == null) return null;
        String email = authentication.getName();
        return userService.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping("/public")
    public ResponseEntity<List<Scheme>> getPublicSchemes() {
        return ResponseEntity.ok(schemeService.getAllSchemes());
    }

    @GetMapping
    public ResponseEntity<?> getSchemes(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.ok(schemeService.getAllSchemes());
        }
        
        // For authenticated users, return list of schemes with basic status if calculated
        DataWallet wallet = walletService.getWalletByUserId(userId).orElse(null);
        if (wallet == null) {
            return ResponseEntity.ok(schemeService.getAllSchemes());
        }
        return ResponseEntity.ok(schemeService.getRankedEligibilityResults(userId, wallet));
    }

    @GetMapping("/eligibility")
    public ResponseEntity<?> getEligibilityResults(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        DataWallet wallet = walletService.getWalletByUserId(userId).orElse(null);
        if (wallet == null) {
            Map<String, String> resp = new HashMap<>();
            resp.put("error", "Data Wallet not initialized");
            return ResponseEntity.badRequest().body(resp);
        }
        
        return ResponseEntity.ok(schemeService.getRankedEligibilityResults(userId, wallet));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSchemeDetails(Authentication authentication, @PathVariable Long id) {
        Scheme scheme = schemeService.getSchemeById(id).orElse(null);
        if (scheme == null) {
            return ResponseEntity.notFound().build();
        }

        List<SchemeRequirement> requirements = requirementRepository.findBySchemeId(id);
        List<SchemeApplicationStep> steps = stepRepository.findBySchemeIdOrderByStepNumberAsc(id);
        
        Map<String, Object> details = new HashMap<>();
        details.put("scheme", scheme);
        details.put("requirements", requirements);
        details.put("steps", steps);

        Long userId = getUserId(authentication);
        if (userId != null) {
            DataWallet wallet = walletService.getWalletByUserId(userId).orElse(null);
            details.put("wallet", wallet);
            
            if (wallet != null) {
                // Return eligibility evaluation details
                List<Map<String, Object>> rankedResults = schemeService.getRankedEligibilityResults(userId, wallet);
                Map<String, Object> matchResult = rankedResults.stream()
                        .filter(r -> r.get("schemeId").equals(id))
                        .findFirst()
                        .orElse(null);
                
                details.put("eligibility", matchResult);
            }
            details.put("saved", savedSchemeRepository.existsByUserIdAndSchemeId(userId, id));
        }

        return ResponseEntity.ok(details);
    }

    @GetMapping("/saved")
    public ResponseEntity<?> getSavedSchemes(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(schemeService.getSavedSchemesForUser(userId));
    }

    @PostMapping("/save/{id}")
    public ResponseEntity<?> saveScheme(Authentication authentication, @PathVariable Long id) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        schemeService.saveScheme(userId, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unsave/{id}")
    public ResponseEntity<?> unsaveScheme(Authentication authentication, @PathVariable Long id) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        schemeService.unsaveScheme(userId, id);
        return ResponseEntity.ok().build();
    }
}
