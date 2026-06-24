package com.collabcode.room.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.ProjectRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final FileRepository fileRepository;

    public ProjectService(ProjectRepository projectRepository,
                          RoomRepository roomRepository,
                          RoomMemberRepository roomMemberRepository,
                          FileRepository fileRepository) {
        this.projectRepository = projectRepository;
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.fileRepository = fileRepository;
    }

    private com.collabcode.room.repository.FileRepository fileRepository() {
        return fileRepository;
    }

    @Transactional
    public Map<String, Object> createProject(String roomCode, String name, UUID userId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
        requireEditor(room.getId(), userId);
        Project project = projectRepository.save(Project.create(room, name));
        return projectDto(project, List.of());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        requireMember(project.getRoom().getId(), userId);
        List<FileEntry> files = fileRepository.findAllByProjectId(projectId);
        return projectDto(project, files);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProjectsForRoom(String roomCode, UUID userId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
        requireMember(room.getId(), userId);
        return projectRepository.findAllByRoomId(room.getId()).stream()
                .map(p -> projectDto(p, fileRepository.findAllByProjectId(p.getId())))
                .toList();
    }

    @Transactional
    public Map<String, Object> patchProject(UUID projectId, String newName, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        requireEditor(project.getRoom().getId(), userId);
        if (newName != null && !newName.isBlank()) {
            project.setName(newName);
        }
        projectRepository.save(project);
        return projectDto(project, fileRepository.findAllByProjectId(project.getId()));
    }

    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        requireOwner(project.getRoom().getId(), userId);
        projectRepository.delete(project);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void requireMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not a member of this room");
        }
    }

    private void requireEditor(UUID roomId, UUID userId) {
        MemberRole role = roomMemberRepository.findRoleByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (!role.canEdit()) {
            throw ApiException.forbidden("FORBIDDEN", "Editor or Owner role required");
        }
    }

    private void requireOwner(UUID roomId, UUID userId) {
        MemberRole role = roomMemberRepository.findRoleByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (!role.isOwner()) {
            throw ApiException.forbidden("FORBIDDEN", "Owner role required");
        }
    }

    public static Map<String, Object> projectDto(Project project, List<FileEntry> files) {
        List<Map<String, Object>> fileDtos = files.stream().map(ProjectService::fileDto).toList();
        return Map.of(
                "id", project.getId().toString(),
                "roomId", project.getRoom().getId().toString(),
                "name", project.getName(),
                "createdAt", project.getCreatedAt().toString(),
                "files", fileDtos
        );
    }

    public static Map<String, Object> fileDto(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "projectId", f.getProject().getId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "createdAt", f.getCreatedAt().toString()
        );
    }
}
