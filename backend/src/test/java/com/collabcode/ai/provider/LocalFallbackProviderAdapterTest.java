package com.collabcode.ai.provider;

import com.collabcode.ai.model.AiFeature;
import com.collabcode.ai.model.AiGatewayRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

class LocalFallbackProviderAdapterTest {

    private final LocalFallbackProviderAdapter adapter = new LocalFallbackProviderAdapter();

    @Test
    void generatesNonEmptyOutputForEveryAiFeature() {
        for (AiFeature feature : AiFeature.values()) {
            String output = adapter.generate(new AiGatewayRequest(
                    feature,
                    "javascript",
                    "src/index.ts",
                    "function subjectUnderTest() { return 1; }",
                    "",
                    "Help with this file",
                    List.of(),
                    List.of()
            ));

            assertFalse(output.isBlank(), feature + " should produce a fallback response");
        }
    }
}
