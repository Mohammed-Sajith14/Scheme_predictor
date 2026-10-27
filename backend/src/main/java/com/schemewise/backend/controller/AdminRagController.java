package com.schemewise.backend.controller;

import com.schemewise.backend.model.SchemeSource;
import com.schemewise.backend.service.AdminRagService;
import com.schemewise.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/rag")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminRagController {

    private final AdminRagService adminRagService;
    private final AuditLogService auditLogService;

    @GetMapping("/status")
    public ResponseEntity<?> getRagStatus() {
        return ResponseEntity.ok(adminRagService.getRagStatus());
    }

    @GetMapping("/schemes-overview")
    public ResponseEntity<?> getAllSchemesOverview() {
        return ResponseEntity.ok(adminRagService.getAllSchemesOverview());
    }

    @GetMapping("/schemes/{schemeId}/sources")
    public ResponseEntity<?> getSchemeSources(@PathVariable Long schemeId) {
        return ResponseEntity.ok(adminRagService.getSchemeSources(schemeId));
    }

    @PostMapping("/schemes/{schemeId}/sources/text")
    public ResponseEntity<?> saveTextSource(
            @PathVariable Long schemeId,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        String sourceTitle = (String) body.getOrDefault("sourceTitle", "");
        String content = (String) body.getOrDefault("content", "");
        boolean autoIndex = body.get("autoIndex") == null || Boolean.parseBoolean(body.get("autoIndex").toString());

        SchemeSource saved = adminRagService.saveTextSource(schemeId, sourceTitle, content, autoIndex);
        auditLogService.log(adminEmail, "CREATE_SOURCE", "RAG", schemeId, "Created text source '" + sourceTitle + "' (Indexed: " + autoIndex + ")");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/sources/{sourceId}/text")
    public ResponseEntity<?> updateTextSource(
            @PathVariable Long sourceId,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        String sourceTitle = (String) body.getOrDefault("sourceTitle", "");
        String content = (String) body.getOrDefault("content", "");
        boolean autoIndex = body.get("autoIndex") == null || Boolean.parseBoolean(body.get("autoIndex").toString());

        SchemeSource updated = adminRagService.updateTextSource(sourceId, sourceTitle, content, autoIndex);
        auditLogService.log(adminEmail, "UPDATE_SOURCE", "RAG", updated.getSchemeId(), "Updated text source ID " + sourceId + " ('" + sourceTitle + "')");
        return ResponseEntity.ok(updated);
    }

    @PostMapping(value = "/schemes/{schemeId}/sources/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPdfSource(
            @PathVariable Long schemeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("sourceTitle") String sourceTitle,
            @RequestParam(value = "autoIndex", defaultValue = "true") boolean autoIndex,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        try {
            SchemeSource saved = adminRagService.uploadPdfSource(schemeId, sourceTitle, file, autoIndex);
            auditLogService.log(adminEmail, "UPLOAD_PDF_SOURCE", "RAG", schemeId, "Uploaded PDF source '" + sourceTitle + "' (" + file.getOriginalFilename() + ")");
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "PDF upload processing failed: " + e.getMessage()));
        }
    }

    @PostMapping("/sources/{sourceId}/reindex")
    public ResponseEntity<?> reindexSource(@PathVariable Long sourceId, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        SchemeSource source = adminRagService.reindexSource(sourceId);
        auditLogService.log(adminEmail, "REINDEX_SOURCE", "RAG", source.getSchemeId(), "Re-indexed source ID " + sourceId + " in ChromaDB.");
        return ResponseEntity.ok(source);
    }

    @GetMapping("/sources/{sourceId}/chunks")
    public ResponseEntity<?> getSourceChunks(@PathVariable Long sourceId) {
        return ResponseEntity.ok(adminRagService.getSourceChunks(sourceId));
    }

    @DeleteMapping("/sources/{sourceId}")
    public ResponseEntity<?> deleteSource(@PathVariable Long sourceId, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        adminRagService.deleteSchemeSource(sourceId);
        auditLogService.log(adminEmail, "DELETE_SOURCE", "RAG", null, "Deleted source ID " + sourceId + " and purged vector chunks from ChromaDB.");
        return ResponseEntity.ok(Map.of("status", "success", "message", "Source deleted successfully from database and purged from ChromaDB index."));
    }

    @DeleteMapping("/schemes/{schemeId}/sources/{sourceId}")
    public ResponseEntity<?> deleteSchemeSource(@PathVariable Long schemeId, @PathVariable Long sourceId, Authentication authentication) {
        return deleteSource(sourceId, authentication);
    }

    @PostMapping("/sync")
    public ResponseEntity<?> syncAllSchemes(Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        Map<String, Object> result = adminRagService.syncAllPublishedSchemes();
        auditLogService.log(adminEmail, "REINDEX", "RAG", null, "Triggered complete RAG vector index sync.");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reindex/{schemeId}")
    public ResponseEntity<?> reindexScheme(@PathVariable Long schemeId, Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@schemewise.com";
        Map<String, Object> result = adminRagService.reindexSingleScheme(schemeId);
        auditLogService.log(adminEmail, "REINDEX", "RAG", schemeId, "Triggered re-index for scheme ID: " + schemeId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/schemes/{schemeId}/chunks")
    public ResponseEntity<?> getSchemeChunks(@PathVariable Long schemeId) {
        return ResponseEntity.ok(adminRagService.getSchemeChunks(schemeId));
    }

    @PostMapping("/debug")
    public ResponseEntity<?> testDebugRag(@RequestBody Map<String, Object> body) {
        String question = (String) body.getOrDefault("question", "");
        Long schemeId = body.get("schemeId") != null ? Long.valueOf(body.get("schemeId").toString()) : null;
        return ResponseEntity.ok(adminRagService.testDebugRag(question, schemeId));
    }
}
