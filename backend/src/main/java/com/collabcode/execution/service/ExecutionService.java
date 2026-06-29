package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.ExecutionEngineProperties;
import com.collabcode.execution.dto.RunCodeRequest;
import com.collabcode.execution.dto.RunCodeResponse;
import com.collabcode.execution.dto.SandboxExecuteResult;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.stereotype.Service;


import java.util.Set;
import java.util.UUID;

@Service
public class ExecutionService {

    private static final Set<String> SUPPORTED_LANGUAGES = Set.of(
            "java", "cpp", "python", "javascript", "typescript", "go"
    );

    private final FileRepository fileRepository;
    private final RoomAccessService roomAccessService;
    private final ExecutionEngineClient executionEngineClient;
    private final ExecutionRateLimiter rateLimiter;
    private final ExecutionEngineProperties executionEngineProperties;

    public ExecutionService(FileRepository fileRepository,
                            RoomAccessService roomAccessService,
                            ExecutionEngineClient executionEngineClient,
                            ExecutionRateLimiter rateLimiter,
                            ExecutionEngineProperties executionEngineProperties) {
        this.fileRepository = fileRepository;
        this.roomAccessService = roomAccessService;
        this.executionEngineClient = executionEngineClient;
        this.rateLimiter = rateLimiter;
        this.executionEngineProperties = executionEngineProperties;
    }

    
    public RunCodeResponse runCode(RunCodeRequest request, UUID userId) {
        rateLimiter.checkLimit(userId);

        if (!SUPPORTED_LANGUAGES.contains(request.language().toLowerCase())) {
            throw ApiException.badRequest("UNSUPPORTED_LANGUAGE",
                    "Language not supported. Supported: " + String.join(", ", SUPPORTED_LANGUAGES));
        }

        FileEntry file = fileRepository.findById(request.fileId())
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));

        roomAccessService.requireEditor(file.getRoomId(), userId);

        SandboxExecuteResult result = executionEngineClient.execute(
                request.language().toLowerCase(),
                request.code(),
                request.stdin(),
                executionEngineProperties.getDefaultTimeoutMs()
        );

        return toResponse(result);
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
