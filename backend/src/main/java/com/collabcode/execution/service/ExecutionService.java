package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.SandboxProperties;
import com.collabcode.execution.dto.RunCodeRequest;
import com.collabcode.execution.dto.RunCodeResponse;
import com.collabcode.execution.dto.SandboxExecuteResult;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
public class ExecutionService {

    private static final Set<String> SUPPORTED_LANGUAGES = Set.of(
            "java", "cpp", "python", "javascript", "typescript", "go"
    );

    private final FileRepository fileRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final SandboxClient sandboxClient;
    private final ExecutionRateLimiter rateLimiter;
    private final SandboxProperties sandboxProperties;

    public ExecutionService(FileRepository fileRepository,
                            RoomMemberRepository roomMemberRepository,
                            SandboxClient sandboxClient,
                            ExecutionRateLimiter rateLimiter,
                            SandboxProperties sandboxProperties) {
        this.fileRepository = fileRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.sandboxClient = sandboxClient;
        this.rateLimiter = rateLimiter;
        this.sandboxProperties = sandboxProperties;
    }

    @Transactional(readOnly = true)
    public RunCodeResponse runCode(RunCodeRequest request, UUID userId) {
        rateLimiter.checkLimit(userId);

        if (!SUPPORTED_LANGUAGES.contains(request.language().toLowerCase())) {
            throw ApiException.badRequest("UNSUPPORTED_LANGUAGE",
                    "Language not supported. Supported: " + String.join(", ", SUPPORTED_LANGUAGES));
        }

        FileEntry file = fileRepository.findById(request.fileId())
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));

        requireEditor(file.getProject().getRoom().getId(), userId);

        SandboxExecuteResult result = sandboxClient.execute(
                request.language().toLowerCase(),
                request.code(),
                request.stdin(),
                sandboxProperties.getDefaultTimeoutMs()
        );

        return toResponse(result);
    }

    private void requireEditor(UUID roomId, UUID userId) {
        MemberRole role = roomMemberRepository.findRoleByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (!role.canEdit()) {
            throw ApiException.forbidden("FORBIDDEN", "Editor or Owner role required to execute code");
        }
    }

    private RunCodeResponse toResponse(SandboxExecuteResult result) {
        String stderr = result.stderr();
        if (result.timedOut()) {
            stderr = stderr.isBlank()
                    ? "Execution timed out"
                    : stderr;
        }
        if (result.error() != null && !"EXECUTION_TIMEOUT".equals(result.error())) {
            stderr = stderr.isBlank() ? result.error() : stderr;
        }
        return new RunCodeResponse(
                nullToEmpty(result.stdout()),
                nullToEmpty(stderr),
                result.exitCode(),
                result.executionTimeMs()
        );
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
