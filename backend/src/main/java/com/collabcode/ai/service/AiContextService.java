package com.collabcode.ai.service;

import com.collabcode.ai.dto.AiContextFile;
import com.collabcode.ai.dto.AiRequest;
import com.collabcode.ai.model.AiFeature;
import com.collabcode.common.exception.ApiException;
import com.collabcode.config.AiProperties;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.domain.Project;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.ProjectRepository;
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
    private final ProjectRepository projectRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final AiPromptSanitizer sanitizer;
    private final AiProperties properties;

    public AiContextService(FileRepository fileRepository,
                            ProjectRepository projectRepository,
                            RoomMemberRepository roomMemberRepository,
                            AiPromptSanitizer sanitizer,
                            AiProperties properties) {
        this.fileRepository = fileRepository;
        this.projectRepository = projectRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.sanitizer = sanitizer;
        this.properties = properties;
    }

    
    public ContextEnvelope load(AiRequest request, UUID userId, AiFeature feature) {
        FileEntry activeFile = null;
        Project project = null;
        if (request.fileId() != null) {
            activeFile = fileRepository.findById(request.fileId())
                    .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
            project = projectRepository.findById(activeFile.getProjectId())
                    .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        } else if (request.projectId() != null) {
            project = projectRepository.findById(request.projectId())
                    .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Project not found"));
        }

        if (project == null && activeFile != null) {
            project = projectRepository.findById(activeFile.getProjectId()).orElse(null);
        }
        if (project != null) {
            requireAccess(project.getRoomId(), userId, feature);
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
                Project p = projectRepository.findById(file.getProjectId()).orElse(null);
                if (p != null) {
                    requireAccess(p.getRoomId(), userId, AiFeature.CHAT);
                }
                files.putIfAbsent(file.getId(), toContextFile(file, null));
            }
        }

        if (project != null && files.size() < properties.getMaxContextFiles()) {
            for (FileEntry file : fileRepository.findAllByProjectId(project.getId())) {
                if (files.size() >= properties.getMaxContextFiles()) break;
                files.putIfAbsent(file.getId(), toContextFile(file, null));
            }
        }

        String code = request.safeCode();
        if (code.isBlank() && activeFile != null) {
            code = activeFile.getContent();
        }

        return new ContextEnvelope(
                sanitizer.sanitize(request.safeLanguage()),
                sanitizer.sanitize(request.path() != null ? request.path() : activeFile != null ? activeFile.getPath() : ""),
                sanitizer.sanitize(code),
                sanitizer.sanitize(request.safeSelection()),
                sanitizer.sanitize(request.safeInstruction()),
                new ArrayList<>(files.values())
        );
    }

    private void requireAccess(UUID roomId, UUID userId, AiFeature feature) {
        MemberRole role = roomMemberRepository.findByRoomIdAndUserId(roomId, userId).map(com.collabcode.room.domain.RoomMember::getRole)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
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
