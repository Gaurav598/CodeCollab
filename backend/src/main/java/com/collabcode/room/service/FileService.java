package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;


import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final RoomAccessService roomAccessService;
    private final SimpMessagingTemplate messagingTemplate;

    public FileService(FileRepository fileRepository,
                       RoomAccessService roomAccessService,
                       SimpMessagingTemplate messagingTemplate) {
        this.fileRepository = fileRepository;
        this.roomAccessService = roomAccessService;
        this.messagingTemplate = messagingTemplate;
    }

    
    @Transactional
    public Map<String, Object> createFile(UUID roomId, String path, String language, UUID userId) {
        roomAccessService.requireEditor(roomId, userId);
        String normalizedPath = normalizePath(path);
        if (fileRepository.existsByRoomIdAndPath(roomId, normalizedPath)) {
            throw ApiException.conflict("FILE_ALREADY_EXISTS", "A file with this path already exists in the room");
        }
        FileEntry file = fileRepository.save(FileEntry.create(roomId, normalizedPath, normalizeLanguage(language)));
        broadcastWorkspaceChange(roomId);
        return fileDto(file);
    }

    
    @Transactional(readOnly = true)
    public Map<String, Object> getFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        roomAccessService.requireMember(file.getRoomId(), userId);
        return fileWithContent(file);
    }

    
    @Transactional
    public Map<String, Object> patchFile(UUID fileId, String newPath, String newLanguage, String content, UUID userId) {
        FileEntry file = findFile(fileId);
        UUID roomId = file.getRoomId();
        roomAccessService.requireEditor(roomId, userId);

        boolean metadataChanged = false;

        if (newPath != null && !newPath.isBlank()) {
            String normalizedPath = normalizePath(newPath);
            if (!normalizedPath.equals(file.getPath())
                    && fileRepository.existsByRoomIdAndPathAndIdNot(file.getRoomId(), normalizedPath, file.getId())) {
                throw ApiException.conflict("FILE_ALREADY_EXISTS", "A file with this path already exists in the room");
            }
            if (!normalizedPath.equals(file.getPath())) {
                file.setPath(normalizedPath);
                metadataChanged = true;
            }
        }
        if (newLanguage != null && !newLanguage.isBlank()) {
            String normalized = normalizeLanguage(newLanguage);
            if (!normalized.equals(file.getLanguage())) {
                file.setLanguage(normalized);
                metadataChanged = true;
            }
        }
        
        // Handle frontend debounced saves — content-only patches do NOT broadcast
        if (content != null) {
            file.setContent(content);
        }
        
        fileRepository.save(file);

        // Broadcast only on path/language change, not on every content autosave
        if (metadataChanged) {
            broadcastWorkspaceChange(roomId);
        }

        return fileDto(file);
    }

    
    @Transactional
    public void deleteFile(UUID fileId, UUID userId) {
        FileEntry file = findFile(fileId);
        UUID roomId = file.getRoomId();
        roomAccessService.requireEditor(roomId, userId);
        fileRepository.delete(file);
        broadcastWorkspaceChange(roomId);
    }

    
    @Transactional
    public void updateContent(UUID fileId, String content) {
        FileEntry file = findFile(fileId);
        file.setContent(content);
        fileRepository.save(file);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Notify all room members that the file list has changed. */
    private void broadcastWorkspaceChange(UUID roomId) {
        messagingTemplate.convertAndSend(
            "/topic/room." + roomId + ".workspace",
            Map.of("event", "file.changed", "roomId", roomId.toString())
        );
    }

    private FileEntry findFile(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
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
                "roomId", f.getRoomId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "createdAt", f.getCreatedAt().toString()
        );
    }

    public static Map<String, Object> fileWithContent(FileEntry f) {
        return Map.of(
                "id", f.getId().toString(),
                "roomId", f.getRoomId().toString(),
                "path", f.getPath(),
                "language", f.getLanguage(),
                "content", f.getContent() != null ? f.getContent() : "",
                "createdAt", f.getCreatedAt().toString()
        );
    }
}
