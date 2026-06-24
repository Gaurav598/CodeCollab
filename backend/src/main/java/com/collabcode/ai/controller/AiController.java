package com.collabcode.ai.controller;

import com.collabcode.ai.dto.AiRequest;
import com.collabcode.ai.dto.AiResponse;
import com.collabcode.ai.dto.AutocompleteResponse;
import com.collabcode.ai.model.AiFeature;
import com.collabcode.ai.service.AiFeatureService;
import com.collabcode.auth.security.CollabUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiFeatureService aiFeatureService;

    public AiController(AiFeatureService aiFeatureService) {
        this.aiFeatureService = aiFeatureService;
    }

    @PostMapping("/autocomplete")
    public ResponseEntity<AutocompleteResponse> autocomplete(@Valid @RequestBody AiRequest request,
                                                             @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(aiFeatureService.autocomplete(request, userId(principal)));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiResponse> chat(@Valid @RequestBody AiRequest request,
                                           @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.CHAT, request, principal);
    }

    @PostMapping("/refactor")
    public ResponseEntity<AiResponse> refactor(@Valid @RequestBody AiRequest request,
                                               @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.REFACTOR, request, principal);
    }

    @PostMapping("/detect-bugs")
    public ResponseEntity<AiResponse> detectBugs(@Valid @RequestBody AiRequest request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.BUG_DETECTION, request, principal);
    }

    @PostMapping("/explain")
    public ResponseEntity<AiResponse> explain(@Valid @RequestBody AiRequest request,
                                              @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.EXPLAIN, request, principal);
    }

    @PostMapping("/review")
    public ResponseEntity<AiResponse> review(@Valid @RequestBody AiRequest request,
                                             @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.REVIEW, request, principal);
    }

    @PostMapping("/generate-tests")
    public ResponseEntity<AiResponse> generateTests(@Valid @RequestBody AiRequest request,
                                                    @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.TEST_GENERATION, request, principal);
    }

    @PostMapping("/generate-docs")
    public ResponseEntity<AiResponse> generateDocs(@Valid @RequestBody AiRequest request,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return feature(AiFeature.DOCUMENTATION, request, principal);
    }

    private ResponseEntity<AiResponse> feature(AiFeature feature, AiRequest request, UserDetails principal) {
        return ResponseEntity.ok(aiFeatureService.runFeature(feature, request, userId(principal)));
    }

    private UUID userId(UserDetails principal) {
        return ((CollabUserDetails) principal).getId();
    }
}
