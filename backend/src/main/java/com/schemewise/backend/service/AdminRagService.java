package com.schemewise.backend.service;

import com.schemewise.backend.model.*;
import com.schemewise.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRagService {

    private final SchemeRepository schemeRepository;
    private final SchemeRequirementRepository requirementRepository;
    private final SchemeFAQRepository faqRepository;
    private final SchemeSourceRepository schemeSourceRepository;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(15000);
        return new RestTemplate(factory);
    }
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Map<String, Object> getAllSchemesOverview() {
        List<Scheme> allSchemes = schemeRepository.findAll();
        List<Map<String, Object>> schemeList = new ArrayList<>();

        for (Scheme s : allSchemes) {
            Map<String, Object> sMap = new HashMap<>();
            sMap.put("id", s.getId());
            sMap.put("name", s.getName());
            sMap.put("department", s.getDepartment());
            sMap.put("category", s.getCategory());
            sMap.put("status", s.getStatus() != null ? s.getStatus() : "PUBLISHED");

            List<SchemeSource> sources = schemeSourceRepository.findBySchemeIdOrderByIdDesc(s.getId());
            sMap.put("sources", sources);
            sMap.put("sourceCount", sources.size());

            int totalChunks = sources.stream()
                    .mapToInt(src -> src.getChunkCount() != null ? src.getChunkCount() : 0)
                    .sum();
            sMap.put("indexedChunkCount", totalChunks);

            boolean hasFailed = sources.stream().anyMatch(src -> "FAILED".equalsIgnoreCase(src.getIndexingStatus()));
            boolean hasIndexed = sources.stream().anyMatch(src -> "INDEXED".equalsIgnoreCase(src.getIndexingStatus()));
            boolean hasPending = sources.stream().anyMatch(src -> "PENDING".equalsIgnoreCase(src.getIndexingStatus()));

            String overallStatus = "EMPTY";
            if (sources.isEmpty()) {
                overallStatus = "NO_SOURCES";
            } else if (hasFailed) {
                overallStatus = "ERROR";
            } else if (hasPending) {
                overallStatus = "PENDING";
            } else if (hasIndexed) {
                overallStatus = "INDEXED";
            } else {
                overallStatus = "NOT_INDEXED";
            }
            sMap.put("ragStatus", overallStatus);

            schemeList.add(sMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("schemes", schemeList);
        result.put("totalSchemes", allSchemes.size());
        return result;
    }

    public List<SchemeSource> getSchemeSources(Long schemeId) {
        return schemeSourceRepository.findBySchemeIdOrderByIdDesc(schemeId);
    }

    public SchemeSource saveTextSource(Long schemeId, String sourceTitle, String textContent, boolean autoIndex) {
        Scheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found with ID: " + schemeId));

        if (sourceTitle == null || sourceTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Source title is required.");
        }
        if (textContent == null || textContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Source content cannot be empty.");
        }

        String now = LocalDateTime.now().format(DATE_FORMATTER);
        SchemeSource source = SchemeSource.builder()
                .schemeId(schemeId)
                .sourceName(sourceTitle.trim())
                .sourceType("Text")
                .rawText(textContent.trim())
                .createdAt(now)
                .updatedAt(now)
                .indexingStatus("PENDING")
                .chunkCount(0)
                .build();

        SchemeSource savedSource = schemeSourceRepository.save(source);

        if (autoIndex) {
            indexSourceInChroma(scheme, savedSource);
        }

        return savedSource;
    }

    public SchemeSource updateTextSource(Long sourceId, String sourceTitle, String textContent, boolean autoIndex) {
        SchemeSource source = schemeSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with ID: " + sourceId));

        final Long associatedSchemeId = source.getSchemeId();
        Scheme scheme = schemeRepository.findById(associatedSchemeId)
                .orElseThrow(() -> new IllegalArgumentException("Associated scheme not found with ID: " + associatedSchemeId));

        if (sourceTitle == null || sourceTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Source title is required.");
        }
        if (textContent == null || textContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Source content cannot be empty.");
        }

        source.setSourceName(sourceTitle.trim());
        source.setRawText(textContent.trim());
        source.setUpdatedAt(LocalDateTime.now().format(DATE_FORMATTER));

        if (autoIndex) {
            indexSourceInChroma(scheme, source);
        } else {
            source.setIndexingStatus("NOT_INDEXED");
            return schemeSourceRepository.save(source);
        }

        return source;
    }

    public SchemeSource uploadPdfSource(Long schemeId, String sourceTitle, MultipartFile file, boolean autoIndex) throws IOException {
        Scheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found with ID: " + schemeId));

        if (sourceTitle == null || sourceTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Source title is required.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a valid non-empty PDF file to upload.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        if (!originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Invalid file format. Only PDF files (.pdf) are allowed.");
        }

        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the 20MB limit. Current size: " + (file.getSize() / (1024 * 1024)) + "MB.");
        }

        byte[] fileBytes = file.getBytes();
        if (fileBytes.length < 4 || fileBytes[0] != '%' || fileBytes[1] != 'P' || fileBytes[2] != 'D' || fileBytes[3] != 'F') {
            throw new IllegalArgumentException("Corrupted or invalid PDF header. File must be a valid PDF document.");
        }

        // Save file locally
        Path uploadDir = Paths.get("uploads", "rag_sources", schemeId.toString());
        Files.createDirectories(uploadDir);
        String safeName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetPath = uploadDir.resolve(safeName);
        Files.write(targetPath, fileBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

        // Forward to ML service for text extraction
        String extractedText = extractPdfTextFromMlService(fileBytes, originalFilename);

        String now = LocalDateTime.now().format(DATE_FORMATTER);
        SchemeSource source = SchemeSource.builder()
                .schemeId(schemeId)
                .sourceName(sourceTitle.trim())
                .sourceType("PDF")
                .fileName(originalFilename)
                .filePath(targetPath.toString())
                .fileSize(file.getSize())
                .rawText(extractedText)
                .createdAt(now)
                .updatedAt(now)
                .indexingStatus("PENDING")
                .chunkCount(0)
                .build();

        SchemeSource savedSource = schemeSourceRepository.save(source);

        if (autoIndex) {
            indexSourceInChroma(scheme, savedSource);
        }

        return savedSource;
    }

    private String extractPdfTextFromMlService(byte[] fileBytes, String filename) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(mlServiceUrl + "/rag/extract-pdf", requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map bodyMap = response.getBody();
                String text = (String) bodyMap.get("text");
                if (text != null && text.trim().length() >= 10) {
                    return text.trim();
                }
            }
            throw new IllegalArgumentException("The uploaded PDF contains no extractable text. Scanned or image-only PDFs without OCR are not supported.");
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("ML service PDF extraction error: {}", errorBody);
            if (errorBody.contains("extractable text") || errorBody.contains("scanned")) {
                throw new IllegalArgumentException("The uploaded PDF contains no extractable text. Scanned or image-only PDFs without OCR are not supported.");
            }
            throw new IllegalArgumentException("Failed to extract text from PDF: " + e.getStatusText());
        } catch (Exception e) {
            log.error("PDF extraction call failed: {}", e.getMessage());
            throw new IllegalArgumentException("PDF text extraction failed: " + e.getMessage());
        }
    }

    public SchemeSource reindexSource(Long sourceId) {
        SchemeSource source = schemeSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with ID: " + sourceId));

        Scheme scheme = schemeRepository.findById(source.getSchemeId())
                .orElseThrow(() -> new IllegalArgumentException("Associated scheme not found with ID: " + source.getSchemeId()));

        if (source.getRawText() == null || source.getRawText().trim().isEmpty()) {
            source.setIndexingStatus("FAILED");
            source.setIndexingError("No text content available to index for this source.");
            return schemeSourceRepository.save(source);
        }

        indexSourceInChroma(scheme, source);
        return source;
    }

    private void indexSourceInChroma(Scheme scheme, SchemeSource source) {
        try {
            boolean isPublished = "PUBLISHED".equalsIgnoreCase(scheme.getStatus()) || scheme.getStatus() == null;

            Map<String, Object> payload = new HashMap<>();
            payload.put("scheme_id", scheme.getId());
            payload.put("scheme_name", scheme.getName());
            payload.put("source_id", source.getId());
            payload.put("source_title", source.getSourceName());
            payload.put("source_type", source.getSourceType() != null ? source.getSourceType() : "Text");
            payload.put("text", source.getRawText());
            payload.put("is_published", isPublished);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlServiceUrl + "/rag/index-source", entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map res = response.getBody();
                Integer chunkCount = res.get("chunkCount") != null ? ((Number) res.get("chunkCount")).intValue() : 0;
                String lastSync = (String) res.get("lastIndexedAt");

                source.setIndexingStatus("INDEXED");
                source.setChunkCount(chunkCount);
                source.setLastIndexedAt(lastSync != null ? lastSync : LocalDateTime.now().format(DATE_FORMATTER));
                source.setIndexingError(null);
            } else {
                source.setIndexingStatus("FAILED");
                source.setIndexingError("ML service returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to index source ID {} in ChromaDB: {}", source.getId(), e.getMessage());
            source.setIndexingStatus("FAILED");
            source.setIndexingError("Indexing failed: " + e.getMessage());
        }

        schemeSourceRepository.save(source);
    }

    public Map<String, Object> getSourceChunks(Long sourceId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlServiceUrl + "/rag/source/" + sourceId + "/chunks", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to retrieve chunks for source ID {}: {}", sourceId, e.getMessage());
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("sourceId", sourceId);
        fallback.put("chunkCount", 0);
        fallback.put("chunks", Collections.emptyList());
        fallback.put("error", "Unable to retrieve chunks from ChromaDB.");
        return fallback;
    }

    public void deleteSchemeSource(Long sourceId) {
        SchemeSource source = schemeSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with ID: " + sourceId));

        // Purge vector chunks from ChromaDB
        try {
            restTemplate.delete(mlServiceUrl + "/rag/source/" + source.getSchemeId() + "/" + sourceId);
            log.info("Purged vector chunks for source ID {} from ChromaDB.", sourceId);
        } catch (Exception e) {
            log.warn("Failed to delete source chunks from ChromaDB: {}", e.getMessage());
        }

        // Delete local PDF file if exists
        if (source.getFilePath() != null) {
            try {
                Path p = Paths.get(source.getFilePath());
                Files.deleteIfExists(p);
            } catch (Exception e) {
                log.warn("Could not delete local file {}: {}", source.getFilePath(), e.getMessage());
            }
        }

        schemeSourceRepository.deleteById(sourceId);
    }

    public SchemeSource saveSchemeSource(Long schemeId, SchemeSource source) {
        Scheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found with ID: " + schemeId));
        source.setSchemeId(schemeId);
        String now = LocalDateTime.now().format(DATE_FORMATTER);
        if (source.getCreatedAt() == null) source.setCreatedAt(now);
        source.setUpdatedAt(now);
        return schemeSourceRepository.save(source);
    }

    public Map<String, Object> syncAllPublishedSchemes() {
        List<Scheme> publishedSchemes = schemeRepository.findAll().stream()
                .filter(s -> s.getStatus() == null || "PUBLISHED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        List<Map<String, Object>> schemePayloads = new ArrayList<>();
        for (Scheme s : publishedSchemes) {
            schemePayloads.add(buildSchemePayload(s));
        }

        Map<String, Object> request = new HashMap<>();
        request.put("schemes", schemePayloads);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlServiceUrl + "/rag/index", entity, Map.class);
            log.info("RAG Index sync completed. Response: {}", response.getBody());

            Map<String, Object> resMap = new HashMap<>();
            resMap.put("status", "success");
            resMap.put("syncedCount", publishedSchemes.size());
            resMap.put("mlResponse", response.getBody());
            return resMap;
        } catch (Exception e) {
            log.error("Failed to sync RAG index with ML service at {}: {}", mlServiceUrl, e.getMessage());
            Map<String, Object> resMap = new HashMap<>();
            resMap.put("status", "error");
            resMap.put("message", "ML service unavailable: " + e.getMessage());
            return resMap;
        }
    }

    public Map<String, Object> reindexSingleScheme(Long schemeId) {
        Scheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found with ID: " + schemeId));

        Map<String, Object> request = new HashMap<>();
        request.put("schemes", List.of(buildSchemePayload(scheme)));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlServiceUrl + "/rag/index", entity, Map.class);
            Map<String, Object> resMap = new HashMap<>();
            resMap.put("status", "success");
            resMap.put("schemeId", schemeId);
            resMap.put("mlResponse", response.getBody());
            return resMap;
        } catch (Exception e) {
            log.error("Failed to reindex scheme ID {} with ML service: {}", schemeId, e.getMessage());
            Map<String, Object> resMap = new HashMap<>();
            resMap.put("status", "error");
            resMap.put("message", "ML service unavailable: " + e.getMessage());
            return resMap;
        }
    }

    public Map<String, Object> getSchemeChunks(Long schemeId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlServiceUrl + "/rag/scheme/" + schemeId + "/chunks", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to retrieve chunks for scheme ID {}: {}", schemeId, e.getMessage());
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("schemeId", schemeId);
        fallback.put("chunkCount", 0);
        fallback.put("chunks", Collections.emptyList());
        fallback.put("error", "Unable to retrieve chunks from ChromaDB");
        return fallback;
    }

    public Map<String, Object> removeSchemeFromRag(Long schemeId) {
        try {
            restTemplate.delete(mlServiceUrl + "/rag/delete/" + schemeId);
            return Map.of("status", "success", "message", "Scheme vector documents removed from ChromaDB.");
        } catch (Exception e) {
            log.error("Failed to delete scheme ID {} from ChromaDB: {}", schemeId, e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    public Map<String, Object> getRagStatus() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlServiceUrl + "/rag/status", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("ML Service /rag/status failed: {}", e.getMessage());
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("chromaStatus", "Connecting...");
        fallback.put("collectionName", "schemewise_docs");
        fallback.put("indexedSchemes", schemeRepository.count());
        fallback.put("indexedChunks", 0);
        fallback.put("lastSync", "Pending Connection");
        return fallback;
    }

    public Map<String, Object> testDebugRag(String question, Long schemeId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("question", question);
            if (schemeId != null) payload.put("scheme_id", schemeId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(mlServiceUrl + "/rag/debug", entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Debug RAG query failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("query", question);
            fallback.put("error", "ML service debug query failed: " + e.getMessage());
            fallback.put("retrievedContext", Collections.emptyList());
            return fallback;
        }
    }

    private Map<String, Object> buildSchemePayload(Scheme s) {
        List<SchemeRequirement> reqs = requirementRepository.findBySchemeId(s.getId());
        StringBuilder criteriaBuilder = new StringBuilder();
        for (SchemeRequirement r : reqs) {
            criteriaBuilder.append(r.getFieldName())
                    .append(" ")
                    .append(r.getOperator())
                    .append(" ")
                    .append(r.getRequiredValue());
            if (Boolean.TRUE.equals(r.getMandatory())) {
                criteriaBuilder.append(" (Mandatory)");
            }
            criteriaBuilder.append("; ");
        }

        List<SchemeFAQ> faqs = faqRepository.findBySchemeIdOrderByDisplayOrderAsc(s.getId());
        List<Map<String, Object>> faqList = new ArrayList<>();
        for (SchemeFAQ f : faqs) {
            faqList.add(Map.of("question", f.getQuestion(), "answer", f.getAnswer()));
        }

        List<SchemeSource> sources = schemeSourceRepository.findBySchemeIdOrderByIdDesc(s.getId());
        List<Map<String, Object>> sourceList = new ArrayList<>();
        for (SchemeSource src : sources) {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", src.getId());
            sm.put("sourceName", src.getSourceName());
            sm.put("sourceType", src.getSourceType());
            sm.put("officialUrl", src.getOfficialUrl() != null ? src.getOfficialUrl() : "");
            sm.put("documentUrl", src.getDocumentUrl() != null ? src.getDocumentUrl() : "");
            sm.put("referenceDescription", src.getReferenceDescription() != null ? src.getReferenceDescription() : (src.getRawText() != null ? src.getRawText() : ""));
            sourceList.add(sm);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", s.getId());
        payload.put("name", s.getName());
        payload.put("department", s.getDepartment() != null ? s.getDepartment() : "");
        payload.put("description", s.getDescription() != null ? s.getDescription() : "");
        payload.put("benefits", s.getBenefits() != null ? s.getBenefits() : "");
        payload.put("eligibilityCriteria", criteriaBuilder.toString());
        payload.put("applicationProcess", s.getApplicationProcess() != null ? s.getApplicationProcess() : "");
        payload.put("requiredDocuments", s.getRequiredDocuments() != null ? s.getRequiredDocuments() : "");
        payload.put("beneficiaryType", s.getBeneficiaryType() != null ? s.getBeneficiaryType() : "");
        payload.put("state", s.getState() != null ? s.getState() : "");
        payload.put("deadline", s.getDeadline() != null ? s.getDeadline().toString() : "");
        payload.put("officialUrl", s.getOfficialUrl() != null ? s.getOfficialUrl() : "");
        payload.put("status", s.getStatus() != null ? s.getStatus() : "PUBLISHED");
        payload.put("faqs", faqList);
        payload.put("sources", sourceList);

        return payload;
    }
}
