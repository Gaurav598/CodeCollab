package com.collabcode.room.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.room.dto.CreateSavedCodeRequest;
import com.collabcode.room.service.SavedCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/saved-codes")
public class SavedCodeController {

    private final SavedCodeService savedCodeService;

    public SavedCodeController(SavedCodeService savedCodeService) {
        this.savedCodeService = savedCodeService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveCode(
            @Valid @RequestBody CreateSavedCodeRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedCodeService.saveCode(
                        userId(principal),
                        request.roomCode(),
                        request.fileName(),
                        request.language(),
                        request.code()
                ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUserSavedCodes(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(savedCodeService.getUserSavedCodes(userId(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSavedCode(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(savedCodeService.getSavedCode(id, userId(principal)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSavedCode(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        savedCodeService.deleteSavedCode(id, userId(principal));
        return ResponseEntity.ok(Map.of("message", "Saved code deleted"));
    }

    private UUID userId(UserDetails principal) {
        return ((CollabUserDetails) principal).getId();
    }
}
