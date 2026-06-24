package com.collabcode.ai.service;

import com.collabcode.config.AiProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AiPromptSanitizerTest {

    @Test
    void redactsCommonSecretPatternsAndTruncatesLongInput() {
        AiProperties properties = new AiProperties();
        properties.setMaxPromptChars(80);
        AiPromptSanitizer sanitizer = new AiPromptSanitizer(properties);

        String result = sanitizer.sanitize("""
                OPENAI_API_KEY=sk-live-secret
                token: abc123
                -----BEGIN PRIVATE KEY-----
                private
                -----END PRIVATE KEY-----
                eyJabc.def.ghi
                """.repeat(4));

        assertTrue(result.contains("[REDACTED]"));
        assertTrue(result.contains("[REDACTED_PRIVATE_KEY]"));
        assertTrue(result.contains("[REDACTED_JWT]"));
        assertTrue(result.endsWith("[TRUNCATED]"));
        assertFalse(result.contains("sk-live-secret"));
    }
}
