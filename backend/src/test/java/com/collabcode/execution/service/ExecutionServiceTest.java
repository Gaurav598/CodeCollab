package com.collabcode.execution.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.config.SandboxProperties;
import com.collabcode.execution.dto.RunCodeRequest;
import com.collabcode.execution.dto.SandboxExecuteResult;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.domain.Project;
import com.collabcode.room.domain.Room;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
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
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private SandboxClient sandboxClient;
    @Mock private ExecutionRateLimiter rateLimiter;

    private ExecutionService executionService;
    private final SandboxProperties properties = new SandboxProperties();

    @BeforeEach
    void setUp() {
        executionService = new ExecutionService(
                fileRepository, roomMemberRepository, sandboxClient, rateLimiter, properties
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
        when(roomMemberRepository.findRoleByRoomIdAndUserId(any(), eq(userId)))
                .thenReturn(Optional.of(MemberRole.viewer));

        RunCodeRequest request = new RunCodeRequest(fileId, "console.log('hi')", "javascript", "");

        ApiException ex = assertThrows(ApiException.class,
                () -> executionService.runCode(request, userId));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void runCode_delegatesToSandboxForEditor() {
        UUID userId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();
        FileEntry file = mockFile(fileId);
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));
        when(roomMemberRepository.findRoleByRoomIdAndUserId(any(), eq(userId)))
                .thenReturn(Optional.of(MemberRole.editor));
        when(sandboxClient.execute(eq("python"), anyString(), eq(""), anyInt()))
                .thenReturn(new SandboxExecuteResult("ok\n", "", 0, 42, false, null));

        RunCodeRequest request = new RunCodeRequest(fileId, "print('ok')", "python", "");
        var response = executionService.runCode(request, userId);

        assertEquals("ok\n", response.stdout());
        assertEquals(0, response.exitCode());
        verify(rateLimiter).checkLimit(userId);
    }

    private FileEntry mockFile(UUID fileId) {
        Room room = mock(Room.class);
        when(room.getId()).thenReturn(UUID.randomUUID());
        Project project = mock(Project.class);
        when(project.getRoom()).thenReturn(room);
        FileEntry file = mock(FileEntry.class);
        when(file.getProject()).thenReturn(project);
        return file;
    }
}
