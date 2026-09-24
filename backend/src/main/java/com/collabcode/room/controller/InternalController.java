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

    /** GET /internal/validate-collaboration?roomId=&fileId=&userId= */
    @GetMapping("/validate-collaboration")
    public ResponseEntity<Map<String, Object>> validateCollaboration(
            @RequestParam UUID roomId,
            @RequestParam UUID fileId,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(internalService.validateCollaboration(roomId, fileId, userId));
    }

    /** GET /internal/files/:fileId/collaboration */
    @GetMapping("/files/{fileId}/collaboration")
    public ResponseEntity<Map<String, Object>> getCollaborationSnapshot(@PathVariable UUID fileId) {
        return ResponseEntity.ok(internalService.getCollaborationSnapshot(fileId));
    }

    /** PUT /internal/files/:fileId/collaboration */
    @PutMapping("/files/{fileId}/collaboration")
    public ResponseEntity<Map<String, Object>> saveCollaborationSnapshot(
            @PathVariable UUID fileId,
            @RequestBody Map<String, Object> body) {
        UUID roomId;
        long expectedVersion;
        try {
            roomId = UUID.fromString(String.valueOf(body.get("roomId")));
            expectedVersion = Long.parseLong(String.valueOf(body.get("expectedVersion")));
        } catch (RuntimeException ex) {
            throw com.collabcode.common.exception.ApiException.badRequest(
                    "INVALID_SNAPSHOT", "roomId and expectedVersion are required");
        }
        String state = body.get("state") instanceof String value ? value : null;
        String content = body.get("content") instanceof String value ? value : "";
        return ResponseEntity.ok(internalService.saveCollaborationSnapshot(
                fileId, roomId, expectedVersion, state, content));
    }
}
