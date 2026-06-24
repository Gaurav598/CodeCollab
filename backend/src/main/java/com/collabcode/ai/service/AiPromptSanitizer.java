package com.collabcode.ai.service;

import com.collabcode.config.AiProperties;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class AiPromptSanitizer {

    private static final Pattern ENV_ASSIGNMENT = Pattern.compile("(?i)(api[_-]?key|secret|token|password)\\s*[:=]\\s*[^\\s'\\\"]+");
    private static final Pattern PEM_BLOCK = Pattern.compile("-----BEGIN [A-Z ]+-----[\\s\\S]*?-----END [A-Z ]+-----");
    private static final Pattern JWT = Pattern.compile("eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+");

    private final AiProperties properties;

    public AiPromptSanitizer(AiProperties properties) {
        this.properties = properties;
    }

    public String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String sanitized = PEM_BLOCK.matcher(value).replaceAll("[REDACTED_PRIVATE_KEY]");
        sanitized = JWT.matcher(sanitized).replaceAll("[REDACTED_JWT]");
        sanitized = ENV_ASSIGNMENT.matcher(sanitized).replaceAll("$1=[REDACTED]");
        if (sanitized.length() > properties.getMaxPromptChars()) {
            return sanitized.substring(0, properties.getMaxPromptChars()) + "\n[TRUNCATED]";
        }
        return sanitized;
    }
}
