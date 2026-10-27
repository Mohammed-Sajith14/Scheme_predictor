package com.schemewise.backend.controller;

import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.model.User;
import com.schemewise.backend.service.DataWalletService;
import com.schemewise.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WalletController {

    private final DataWalletService walletService;
    private final UserService userService;

    private Long getUserId(Authentication authentication) {
        if (authentication == null) return null;
        String email = authentication.getName();
        return userService.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping("/get")
    public ResponseEntity<?> getWallet(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        DataWallet wallet = walletService.getWalletByUserId(userId)
                .orElse(DataWallet.builder()
                        .userId(userId)
                        .profileCompletion(0.0)
                        .build());
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateWallet(Authentication authentication, @RequestBody DataWallet wallet) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            DataWallet updated = walletService.saveOrUpdateWallet(userId, wallet);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
