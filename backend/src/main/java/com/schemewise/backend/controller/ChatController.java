package com.schemewise.backend.controller;

import com.schemewise.backend.model.ChatMessage;
import com.schemewise.backend.model.ChatSession;
import com.schemewise.backend.model.User;
import com.schemewise.backend.service.ChatService;
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
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    private Long getUserId(Authentication authentication) {
        if (authentication == null) return null;
        String email = authentication.getName();
        return userService.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(chatService.getSessionsByUserId(userId));
    }

    @PostMapping("/sessions/create")
    public ResponseEntity<?> createSession(Authentication authentication, @RequestBody CreateSessionRequest request) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        ChatSession session = chatService.createSession(userId, request.getSchemeId(), request.getTitle());
        return ResponseEntity.ok(session);
    }

    @GetMapping("/messages/{sessionId}")
    public ResponseEntity<?> getMessages(Authentication authentication, @PathVariable Long sessionId) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        List<ChatMessage> messages = chatService.getMessages(sessionId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/send/{sessionId}")
    public ResponseEntity<?> sendMessage(Authentication authentication, @PathVariable Long sessionId, @RequestBody MessageRequest request) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        try {
            ChatMessage reply = chatService.sendMessage(sessionId, request.getMessage());
            return ResponseEntity.ok(reply);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @Data
    public static class CreateSessionRequest {
        private Long schemeId;
        private String title;
    }

    @Data
    public static class MessageRequest {
        private String message;
    }
}
