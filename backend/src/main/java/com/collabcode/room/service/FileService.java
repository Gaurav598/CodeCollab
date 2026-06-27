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
    private final RoomAccessService roomAccessService;

    public FileService(FileRepository fileRepository,
                       ProjectRepository projectRepository,
                       RoomAccessService roomAccessService) {
        this.fileRepository = fileRepository;
        this.projectRepository = projectRepository;
        this.roomAccessService = roomAccessService;
    }

    
    @Transactional
    public Map<String, Object> createFile(UUID projectId, String path, String language, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        roomAccessService.requireEditor(project.getRoomId(), userId);
        String normalizedPath = normalizePath(path);
        if (fileRepository.existsByProjectIdAndPath(projectId, normalizedPath)) {
            throw ApiException.conflict("FILE_ALREADY_EXISTS", "A file with this path already exists in the project");
        }
        FileEntry file = fileRepository.save(FileEntry.create(projectId, normalizedPath, normalizeLanguage(language)));
        return fileDto(file);
    }

    
    @Transactional(readOnly = true)
    public Map<String, Object> getFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        roomAccessService.requireMember(getRoomIdForFile(file), userId);
        return fileWithContent(file);
    }

    
    @Transactional
    public Map<String, Object> patchFile(UUID fileId, String newPath, String newLanguage, UUID userId) {
        FileEntry file = findFile(fileId);
        roomAccessService.requireEditor(getRoomIdForFile(file), userId);
        if (newPath != null && !newPath.isBlank()) {
            String normalizedPath = normalizePath(newPath);
            if (!normalizedPath.equals(file.getPath())
                    && fileRepository.existsByProjectIdAndPathAndIdNot(file.getProjectId(), normalizedPath, file.getId())) {
                throw ApiException.conflict("FILE_ALREADY_EXISTS", "A file with this path already exists in the project");
            }
            file.setPath(normalizedPath);
        }
        if (newLanguage != null && !newLanguage.isBlank()) file.setLanguage(normalizeLanguage(newLanguage));
        fileRepository.save(file);
        return fileDto(file);
    }

    
    @Transactional
    public void deleteFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        roomAccessService.requireEditor(getRoomIdForFile(file), userId);
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

    private UUID getRoomIdForFile(FileEntry file) {
        return projectRepository.findById(file.getProjectId())
                .map(Project::getRoomId)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
    }

    private String normalizePath(String path) {
        String normalized = path.trim().replace('\\', '/');
        if (normalized.startsWith("/") || normalized.contains("..") || normalized.contains("\u0000")) {
            throw ApiException.badRequest("INVALID_FILE_PATH", "File path must be relative and cannot contain traversal segments");
        }
        return normalized;
    }

    private String normalizeLanguage(String language) {
        return language == null || language.isBlank() ? "plaintext" : language.trim().toLowerCase(Locale.ROOT);
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

    public static Map<String, Object> fileWithContent(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "projectId", f.getProjectId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "content", f.getContent(),
                "createdAt", f.getCreatedAt().toString()
        );
    }
}
