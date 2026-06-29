package com.collabcode.room.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.room.dto.CreateFileRequest;
import com.collabcode.room.dto.PatchFileRequest;
import com.collabcode.room.service.FileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /** POST /files */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createFile(
            @Valid @RequestBody CreateFileRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileService.createFile(request.roomId(), request.path(), request.languageOrDefault(), userId(principal)));
    }

    /** GET /files/:fileId */
    @GetMapping("/{fileId}")
    public ResponseEntity<Map<String, Object>> getFile(
            @PathVariable UUID fileId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(fileService.getFile(fileId, userId(principal)));
    }

    /** PATCH /files/:fileId */
    @PatchMapping("/{fileId}")
    public ResponseEntity<Map<String, Object>> patchFile(
            @PathVariable UUID fileId,
            @Valid @RequestBody PatchFileRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(fileService.patchFile(fileId, request.path(), request.language(), request.content(), userId(principal)));
    }

    /** DELETE /files/:fileId */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @PathVariable UUID fileId,
            @AuthenticationPrincipal UserDetails principal) {
        fileService.deleteFile(fileId, userId(principal));
        return ResponseEntity.ok(Map.of("message", "File deleted"));
    }

    private UUID userId(UserDetails principal) {
        return ((CollabUserDetails) principal).getId();
    }
}
