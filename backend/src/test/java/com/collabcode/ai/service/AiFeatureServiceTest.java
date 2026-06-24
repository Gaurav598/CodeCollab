package com.collabcode.ai.service;

import com.collabcode.ai.dto.AiContextFile;
import com.collabcode.ai.dto.AiRequest;
import com.collabcode.ai.model.AiFeature;
import com.collabcode.ai.model.AiGatewayResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiFeatureServiceTest {

    @Mock private AiContextService contextService;
    @Mock private AiGatewayService gatewayService;
    @Mock private AiRateLimiter rateLimiter;

    private AiFeatureService service;

    @BeforeEach
    void setUp() {
        service = new AiFeatureService(contextService, gatewayService, rateLimiter);
    }

    @Test
    void autocompleteReturnsSuggestionsFromGateway() {
        UUID userId = UUID.randomUUID();
        AiRequest request = new AiRequest(UUID.randomUUID(), null, "python", "main.py", "print", "", "", List.of(), List.of());
        when(contextService.load(request, userId, AiFeature.AUTOCOMPLETE)).thenReturn(context());
        when(gatewayService.generate(any())).thenReturn(new AiGatewayResult("local", true, "    return result", 3));

        var response = service.autocomplete(request, userId);

        assertEquals(List.of("    return result"), response.suggestions());
        assertEquals("local", response.provider());
        verify(rateLimiter).checkLimit(userId, AiFeature.AUTOCOMPLETE);
    }

    @Test
    void bugDetectionParsesSeverityFindings() {
        UUID userId = UUID.randomUUID();
        AiRequest request = new AiRequest(UUID.randomUUID(), null, "javascript", "app.js", "eval(input)", "", "", List.of(), List.of());
        when(contextService.load(request, userId, AiFeature.BUG_DETECTION)).thenReturn(context());
        when(gatewayService.generate(any())).thenReturn(new AiGatewayResult("local", true, "[HIGH] Injection risk\n[LOW] Add tests", 4));

        var response = service.runFeature(AiFeature.BUG_DETECTION, request, userId);

        assertEquals(2, response.findings().size());
        assertEquals("HIGH", response.findings().get(0).get("severity"));
        assertEquals("Injection risk", response.findings().get(0).get("message"));
    }

    @Test
    void refactorExposesPreviewBeforeApply() {
        UUID userId = UUID.randomUUID();
        AiRequest request = new AiRequest(UUID.randomUUID(), null, "typescript", "app.ts", "const x = 1", "const x = 1", "", List.of(), List.of());
        when(contextService.load(request, userId, AiFeature.REFACTOR)).thenReturn(context());
        when(gatewayService.generate(any())).thenReturn(new AiGatewayResult("local", true, "```typescript\nconst result = 1;\n```", 5));

        var response = service.runFeature(AiFeature.REFACTOR, request, userId);

        assertEquals("const result = 1;", response.previewCode());
    }

    private AiContextService.ContextEnvelope context() {
        return new AiContextService.ContextEnvelope(
                "javascript",
                "src/app.js",
                "eval(input)",
                "",
                "",
                List.of(new AiContextFile(UUID.randomUUID().toString(), "src/app.js", "javascript", "eval(input)"))
        );
    }
}
