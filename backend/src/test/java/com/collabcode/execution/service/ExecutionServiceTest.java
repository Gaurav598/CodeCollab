package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.ExecutionEngineProperties;
import com.collabcode.execution.dto.RunCodeRequest;
import com.collabcode.execution.dto.SandboxExecuteResult;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.service.RoomAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @Mock private FileRepository fileRepository;
    @Mock private RoomAccessService roomAccessService;
    @Mock private ExecutionEngineClient executionEngineClient;
    @Mock private ExecutionRateLimiter rateLimiter;

    private ExecutionService executionService;
    private final ExecutionEngineProperties properties = new ExecutionEngineProperties();

    @BeforeEach
    void setUp() {
        executionService = new ExecutionService(
                fileRepository, roomAccessService, executionEngineClient, rateLimiter, properties
        );
    }

    @Test
    void runCode_rejectsUnsupportedLanguage() {
        UUID userId = UUID.randomUUID();
        RunCodeRequest request = new RunCodeRequest(UUID.randomUUID(), "print('hi')", "ruby", "");

        ApiException ex = assertThrows(ApiException.class,
                () -> executionService.runCode(request, userId));
        assertEquals("UNSUPPORTED_LANGUAGE", ex.getCode());
    }

    @Test
    void runCode_rejectsViewerRole() {
        UUID userId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();
        FileEntry file = mockFile(fileId);
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));
        doThrow(ApiException.forbidden("FORBIDDEN", "Editor or Owner role required"))
                .when(roomAccessService).requireEditor(FIXED_ROOM_ID, userId);

        RunCodeRequest request = new RunCodeRequest(fileId, "console.log('hi')", "javascript", "");

        ApiException ex = assertThrows(ApiException.class,
                () -> executionService.runCode(request, userId));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void runCode_delegatesToEngineForEditor() {
        UUID userId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();
        FileEntry file = mockFile(fileId);
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));
        when(executionEngineClient.execute(eq("python"), anyString(), eq(""), anyInt()))
                .thenReturn(new SandboxExecuteResult("ok\n", "", 0, 42, false, null));

        RunCodeRequest request = new RunCodeRequest(fileId, "print('ok')", "python", "");
        var response = executionService.runCode(request, userId);

        assertEquals("ok\n", response.stdout());
        assertEquals(0, response.exitCode());
        verify(rateLimiter).checkLimit(userId);
        verify(roomAccessService).requireEditor(FIXED_ROOM_ID, userId);
    }

    private static final UUID FIXED_ROOM_ID = UUID.randomUUID();

    private FileEntry mockFile(UUID fileId) {
        FileEntry file = mock(FileEntry.class);
        when(file.getRoomId()).thenReturn(FIXED_ROOM_ID);
        return file;
    }
}
