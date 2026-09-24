package com.collabcode.ai.service;

import com.collabcode.ai.dto.AiContextFile;
import com.collabcode.ai.dto.AiRequest;
import com.collabcode.ai.model.AiFeature;
import com.collabcode.common.exception.ApiException;
import com.collabcode.config.AiProperties;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import org.springframework.stereotype.Service;


import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiContextService {

    private final FileRepository fileRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final AiPromptSanitizer sanitizer;
    private final AiProperties properties;

    public AiContextService(FileRepository fileRepository,
                            RoomMemberRepository roomMemberRepository,
                            AiPromptSanitizer sanitizer,
                            AiProperties properties) {
        this.fileRepository = fileRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.sanitizer = sanitizer;
        this.properties = properties;
    }

    public ContextEnvelope load(AiRequest request, UUID userId, AiFeature feature) {
        FileEntry activeFile = null;
        UUID roomId = null;
        if (request.fileId() != null) {
            activeFile = fileRepository.findById(request.fileId())
                    .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
            roomId = activeFile.getRoomId();
            if (request.roomId() != null && !request.roomId().equals(roomId)) {
                throw ApiException.forbidden("FILE_ROOM_MISMATCH", "Active file does not belong to the requested room");
            }
        } else if (request.roomId() != null) {
            roomId = request.roomId();
        }

        if (roomId != null) {
            requireAccess(roomId, userId, feature);
        }

        Map<UUID, AiContextFile> files = new LinkedHashMap<>();
        if (activeFile != null) {
            files.put(activeFile.getId(), toContextFile(activeFile, request.safeCode()));
        }

        if (request.contextFileIds() != null) {
            for (UUID fileId : request.contextFileIds()) {
                if (files.size() >= properties.getMaxContextFiles()) break;
                FileEntry file = fileRepository.findById(fileId)
                        .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "Context file not found"));
                if (roomId != null && !roomId.equals(file.getRoomId())) {
                    throw ApiException.forbidden("FILE_ROOM_MISMATCH", "Context file does not belong to the requested room");
                }
                requireAccess(file.getRoomId(), userId, AiFeature.CHAT);
                files.putIfAbsent(file.getId(), toContextFile(file, null));
            }
        }

        if (roomId != null && files.size() < properties.getMaxContextFiles()) {
            for (FileEntry file : fileRepository.findAllByRoomId(roomId)) {
                if (files.size() >= properties.getMaxContextFiles()) break;
                files.putIfAbsent(file.getId(), toContextFile(file, null));
            }
        }

        String code = request.safeCode();
        if (code.isBlank() && activeFile != null) {
            code = activeFile.getContent();
        }

        String language = sanitizer.sanitize(request.safeLanguage());
        String path = sanitizer.sanitize(request.path() != null ? request.path() : activeFile != null ? activeFile.getPath() : "");
        String sanitizedCode = sanitizer.sanitize(code);
        String selection = sanitizer.sanitize(request.safeSelection());
        String instruction = sanitizer.sanitize(request.safeInstruction());
        int remaining = Math.max(0, properties.getMaxPromptChars()
                - language.length() - path.length() - sanitizedCode.length()
                - selection.length() - instruction.length());
        List<AiContextFile> budgetedFiles = new ArrayList<>();
        for (AiContextFile file : files.values()) {
            if (remaining <= 0) break;
            String content = file.content();
            if (content.length() > remaining) content = content.substring(0, remaining) + "\n[TRUNCATED]";
            budgetedFiles.add(new AiContextFile(file.fileId(), file.path(), file.language(), content));
            remaining -= Math.min(remaining, content.length());
        }

        return new ContextEnvelope(language, path, sanitizedCode, selection, instruction, budgetedFiles);
    }

    private void requireAccess(UUID roomId, UUID userId, AiFeature feature) {
        MemberRole role = roomMemberRepository.findByRoomIdAndUserId(roomId, userId).map(com.collabcode.room.domain.RoomMember::getRole)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (role == MemberRole.pending) {
            throw ApiException.forbidden("PENDING_APPROVAL", "Waiting for room owner approval");
        }
        if (feature.isWriteIntent() && !role.canEdit()) {
            throw ApiException.forbidden("FORBIDDEN", "Editor or Owner role required");
        }
    }

    private AiContextFile toContextFile(FileEntry file, String overrideContent) {
        return new AiContextFile(
                file.getId().toString(),
                sanitizer.sanitize(file.getPath()),
                sanitizer.sanitize(file.getLanguage()),
                sanitizer.sanitize(overrideContent != null ? overrideContent : file.getContent())
        );
    }

    public record ContextEnvelope(
            String language,
            String path,
            String code,
            String selection,
            String instruction,
            List<AiContextFile> contextFiles
    ) {}
}
