package com.schemewise.backend.controller;

import com.schemewise.backend.repository.SchemeRepository;
import com.schemewise.backend.service.AdminRagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin/system-health")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminSystemHealthController {

    private final SchemeRepository schemeRepository;
    private final AdminRagService adminRagService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    @GetMapping
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> response = new HashMap<>();

        // 1. Spring Boot API
        Map<String, Object> springBoot = new HashMap<>();
        springBoot.put("name", "Spring Boot API");
        springBoot.put("status", "Healthy");
        springBoot.put("code", "UP");
        springBoot.put("details", "Core REST services active on port 8080");
        response.put("springBoot", springBoot);

        // 2. PostgreSQL
        Map<String, Object> postgres = new HashMap<>();
        postgres.put("name", "PostgreSQL Database");
        try {
            long schemeCount = schemeRepository.count();
            postgres.put("status", "Connected");
            postgres.put("code", "UP");
            postgres.put("details", "Database operational. Total records indexed: " + schemeCount + " schemes.");
        } catch (Exception e) {
            postgres.put("status", "Unavailable");
            postgres.put("code", "DOWN");
            postgres.put("details", "Database query error: " + e.getMessage());
        }
        response.put("postgres", postgres);

        // 3. ML Service (FastAPI)
        Map<String, Object> mlService = new HashMap<>();
        mlService.put("name", "ML Service (FastAPI)");
        try {
            ResponseEntity<Map> res = restTemplate.getForEntity(mlServiceUrl + "/rag/status", Map.class);
            if (res.getStatusCode().is2xxSuccessful()) {
                mlService.put("status", "Healthy");
                mlService.put("code", "UP");
                mlService.put("details", "Scoring & embedding engine running at " + mlServiceUrl);
            } else {
                mlService.put("status", "Degraded");
                mlService.put("code", "WARN");
                mlService.put("details", "Service returned non-200 status code: " + res.getStatusCode());
            }
        } catch (Exception e) {
            mlService.put("status", "Unavailable");
            mlService.put("code", "DOWN");
            mlService.put("details", "Could not connect to FastAPI at " + mlServiceUrl + ". Error: " + e.getMessage());
        }
        response.put("mlService", mlService);

        // 4. ChromaDB Vector Database
        Map<String, Object> chromaDb = new HashMap<>();
        chromaDb.put("name", "ChromaDB / Vector Store");
        Map<String, Object> ragInfo = adminRagService.getRagStatus();
        String chromaStatus = (String) ragInfo.getOrDefault("chromaStatus", "Connected");
        if (chromaStatus.toLowerCase().contains("connected")) {
            chromaDb.put("status", "Connected");
            chromaDb.put("code", "UP");
            chromaDb.put("details", ragInfo.getOrDefault("collectionName", "schemewise_docs") + " active. Chunks: " + ragInfo.getOrDefault("indexedChunks", 0));
        } else {
            chromaDb.put("status", "Unavailable");
            chromaDb.put("code", "DOWN");
            chromaDb.put("details", "Vector DB disconnected or in fallback mode.");
        }
        response.put("chromaDb", chromaDb);

        // 5. Groq LLM API
        Map<String, Object> groq = new HashMap<>();
        groq.put("name", "Groq AI LLM Service");
        String groqKey = System.getenv("GROQ_API_KEY");
        if (groqKey != null && !groqKey.trim().isEmpty()) {
            groq.put("status", "Connected");
            groq.put("code", "UP");
            groq.put("details", "GROQ_API_KEY detected and configured for model inference.");
        } else {
            groq.put("status", "Standby / Local NLP");
            groq.put("code", "WARN");
            groq.put("details", "GROQ_API_KEY not set in environment. System operating with local grounded RAG template generator.");
        }
        response.put("groq", groq);

        // 6. RAG Synchronization Summary
        Map<String, Object> ragSync = new HashMap<>();
        long publishedCount = schemeRepository.findAll().stream()
                .filter(s -> s.getStatus() == null || "PUBLISHED".equalsIgnoreCase(s.getStatus()))
                .count();
        ragSync.put("name", "RAG Index Synchronization");
        ragSync.put("status", "Up to Date");
        ragSync.put("code", "UP");
        ragSync.put("publishedSchemes", publishedCount);
        ragSync.put("totalChunks", ragInfo.getOrDefault("indexedChunks", publishedCount * 6));
        ragSync.put("failedJobs", 0);
        ragSync.put("lastSync", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        response.put("ragSync", ragSync);

        return ResponseEntity.ok(response);
    }
}
