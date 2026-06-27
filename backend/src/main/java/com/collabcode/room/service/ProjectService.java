package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.ProjectRepository;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.stereotype.Service;


import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final RoomRepository roomRepository;
    private final FileRepository fileRepository;
    private final RoomAccessService roomAccessService;

    public ProjectService(ProjectRepository projectRepository,
                          RoomRepository roomRepository,
                          FileRepository fileRepository,
                          RoomAccessService roomAccessService) {
        this.projectRepository = projectRepository;
        this.roomRepository = roomRepository;
        this.fileRepository = fileRepository;
        this.roomAccessService = roomAccessService;
    }

    
    @Transactional
    public Map<String, Object> createProject(String roomCode, String name, UUID userId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
        roomAccessService.requireEditor(room.getId(), userId);
        Project project = projectRepository.save(Project.create(room.getId(), normalizeName(name)));
        return projectDto(project, List.of());
    }

    
    @Transactional(readOnly = true)
    public Map<String, Object> getProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        roomAccessService.requireMember(project.getRoomId(), userId);
        List<FileEntry> files = fileRepository.findAllByProjectId(projectId);
        return projectDto(project, files);
    }

    
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProjectsForRoom(String roomCode, UUID userId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
        roomAccessService.requireMember(room.getId(), userId);
        List<Project> projects = projectRepository.findAllByRoomId(room.getId());
        if (projects.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<FileEntry>> filesByProject = fileRepository
                .findAllByProjectIdIn(projects.stream().map(Project::getId).toList())
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(FileEntry::getProjectId));
        return projects.stream()
                .map(p -> projectDto(p, filesByProject.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    
    @Transactional
    public Map<String, Object> patchProject(UUID projectId, String newName, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        roomAccessService.requireEditor(project.getRoomId(), userId);
        if (newName != null && !newName.isBlank()) {
            project.setName(normalizeName(newName));
        }
        projectRepository.save(project);
        return projectDto(project, fileRepository.findAllByProjectId(project.getId()));
    }

    
    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        roomAccessService.requireOwner(project.getRoomId(), userId);
        fileRepository.deleteAllByProjectId(projectId);
        projectRepository.delete(project);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String normalizeName(String name) {
        return name.trim();
    }

    public static Map<String, Object> projectDto(Project project, List<FileEntry> files) {
        List<Map<String, Object>> fileDtos = files.stream().map(ProjectService::fileDto).toList();
        return Map.of(
                "id", project.getId().toString(),
                "roomId", project.getRoomId().toString(),
                "name", project.getName(),
                "createdAt", project.getCreatedAt().toString(),
                "files", fileDtos
        );
    }

    public static Map<String, Object> fileDto(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "projectId", f.getProjectId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "createdAt", f.getCreatedAt().toString()
        );
    }
}
