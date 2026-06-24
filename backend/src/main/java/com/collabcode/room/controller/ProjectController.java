package com.collabcode.room.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.room.dto.CreateProjectRequest;
import com.collabcode.room.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /** POST /projects */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(request.roomCode(), request.name(), userId(principal)));
    }

    /** GET /projects/:projectId */
    @GetMapping("/{projectId}")
    public ResponseEntity<Map<String, Object>> getProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(projectService.getProject(projectId, userId(principal)));
    }

    /** DELETE /projects/:projectId */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Map<String, Object>> deleteProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails principal) {
        projectService.deleteProject(projectId, userId(principal));
        return ResponseEntity.ok(Map.of("message", "Project deleted"));
    }

    private UUID userId(UserDetails principal) {
        return ((CollabUserDetails) principal).getId();
    }
}
