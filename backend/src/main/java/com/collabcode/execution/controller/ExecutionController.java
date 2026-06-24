package com.collabcode.execution.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.execution.dto.RunCodeRequest;
import com.collabcode.execution.dto.RunCodeResponse;
import com.collabcode.execution.service.ExecutionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/execution")
public class ExecutionController {

    private final ExecutionService executionService;

    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    /** POST /execution/run */
    @PostMapping("/run")
    public ResponseEntity<RunCodeResponse> runCode(
            @Valid @RequestBody RunCodeRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        RunCodeResponse response = executionService.runCode(request, userId(principal));
        return ResponseEntity.ok(response);
    }

    private UUID userId(UserDetails principal) {
        return ((CollabUserDetails) principal).getId();
    }
}
