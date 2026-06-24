package com.collabcode.room.controller;

import com.collabcode.room.service.InternalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal")
public class InternalController {

    private final InternalService internalService;

    public InternalController(InternalService internalService) {
        this.internalService = internalService;
    }

    /** GET /internal/validate-membership?roomId=&userId= */
    @GetMapping("/validate-membership")
    public ResponseEntity<Map<String, Object>> validateMembership(
            @RequestParam UUID roomId,
            @RequestParam UUID userId) {
        boolean isMember = internalService.validateMembership(roomId, userId);
        if (!isMember) {
            return ResponseEntity.status(403).body(Map.of("allowed", false));
        }
        return ResponseEntity.ok(Map.of("allowed", true));
    }

    /** PUT /internal/files/:fileId/content */
    @PutMapping("/files/{fileId}/content")
    public ResponseEntity<Map<String, Object>> updateFileContent(
            @PathVariable UUID fileId,
            @RequestBody Map<String, String> body) {
        String content = body.getOrDefault("content", "");
        internalService.updateFileContent(fileId, content);
        return ResponseEntity.ok(Map.of("message", "Content updated"));
    }
}
