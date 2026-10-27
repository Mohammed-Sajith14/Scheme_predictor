package com.schemewise.backend.service;

import com.schemewise.backend.model.ChatMessage;
import com.schemewise.backend.model.ChatSession;
import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.repository.ChatMessageRepository;
import com.schemewise.backend.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
@Slf4j
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final DataWalletService walletService;
    
    private final RestTemplate restTemplate;

    public ChatService(ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository, DataWalletService walletService) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.walletService = walletService;
        
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(45000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public ChatSession createSession(Long userId, Long schemeId, String title) {
        return sessionRepository.save(ChatSession.builder()
                .userId(userId)
                .schemeId(schemeId)
                .title(title != null ? title : "Chat on Scheme " + (schemeId != null ? schemeId : "Welfare"))
                .build());
    }

    public List<ChatSession> getSessionsByUserId(Long userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ChatMessage> getMessages(Long sessionId) {
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional
    public ChatMessage sendMessage(Long sessionId, String userMessage) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        // 1. Save user message
        ChatMessage userMsg = messageRepository.save(ChatMessage.builder()
                .sessionId(sessionId)
                .role("user")
                .message(userMessage)
                .build());

        // 2. Fetch User Wallet context
        DataWallet wallet = walletService.getWalletByUserId(session.getUserId()).orElse(null);

        // 3. Prepare payload for FastAPI RAG chat
        String assistantReply = "I'm sorry, I couldn't connect to the AI engine right now.";
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("message", userMessage);
            payload.put("session_id", sessionId);
            payload.put("scheme_id", session.getSchemeId());
            
            if (wallet != null) {
                Map<String, Object> citizenInfo = new HashMap<>();
                citizenInfo.put("age", wallet.getDateOfBirth() != null 
                        ? Period.between(wallet.getDateOfBirth(), LocalDate.now()).getYears() : null);
                citizenInfo.put("income", wallet.getIncome());
                citizenInfo.put("state", wallet.getState());
                citizenInfo.put("student_status", wallet.getStudentStatus());
                citizenInfo.put("farmer_status", wallet.getFarmerStatus());
                citizenInfo.put("disability_status", wallet.getDisabilityStatus());
                payload.put("citizen_wallet", citizenInfo);
            }

            String endpoint = mlServiceUrl + "/rag/chat";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(endpoint, payload, Map.class);
            
            if (response != null && response.containsKey("response")) {
                assistantReply = (String) response.get("response");
            }
        } catch (Exception e) {
            log.error("Failed to fetch response from FastAPI RAG assistant", e);
            assistantReply = "I am currently offline or experiencing connection issues with my knowledge base. "
                    + "Please check if the RAG service is running.";
        }

        // 4. Save assistant reply
        ChatMessage assistantMsg = messageRepository.save(ChatMessage.builder()
                .sessionId(sessionId)
                .role("assistant")
                .message(assistantReply)
                .build());

        return assistantMsg;
    }
}
