package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final ProjectRepository projectRepository;
    private final RoomMemberRepository roomMemberRepository;

    public FileService(FileRepository fileRepository,
                       ProjectRepository projectRepository,
                       RoomMemberRepository roomMemberRepository) {
        this.fileRepository = fileRepository;
        this.projectRepository = projectRepository;
        this.roomMemberRepository = roomMemberRepository;
    }

    @Transactional
    public Map<String, Object> createFile(String projectIdStr, String path, String language, UUID userId) {
        UUID projectId = UUID.fromString(projectIdStr);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        requireEditor(project.getRoom().getId(), userId);
        if (fileRepository.existsByProjectIdAndPath(projectId, path)) {
            throw ApiException.conflict("FILE_ALREADY_EXISTS", "A file with this path already exists in the project");
        }
        FileEntry file = fileRepository.save(FileEntry.create(project, path, language));
        return fileDto(file);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        requireMember(file.getProject().getRoom().getId(), userId);
        return fileWithContent(file);
    }

    @Transactional
    public Map<String, Object> patchFile(UUID fileId, String newPath, String newLanguage, UUID userId) {
        FileEntry file = findFile(fileId);
        requireEditor(file.getProject().getRoom().getId(), userId);
        if (newPath != null && !newPath.isBlank()) file.setPath(newPath);
        if (newLanguage != null && !newLanguage.isBlank()) file.setLanguage(newLanguage);
        fileRepository.save(file);
        return fileDto(file);
    }

    @Transactional
    public void deleteFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        requireEditor(file.getProject().getRoom().getId(), userId);
        fileRepository.delete(file);
    }

    @Transactional
    public void updateContent(UUID fileId, String content) {
        FileEntry file = findFile(fileId);
        file.setContent(content);
        fileRepository.save(file);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private FileEntry findFile(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
    }

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

    public static Map<String, Object> fileDto(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "projectId", f.getProject().getId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "createdAt", f.getCreatedAt().toString()
        );
    }

    public static Map<String, Object> fileWithContent(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "projectId", f.getProject().getId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "content", f.getContent(),
                "createdAt", f.getCreatedAt().toString()
        );
    }
}
