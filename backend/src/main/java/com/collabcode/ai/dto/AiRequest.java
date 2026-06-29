package com.collabcode.ai.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record AiRequest(
        UUID fileId,
        UUID roomId,
        String language,
        String path,
        String code,
        String selection,
        String instruction,
        List<UUID> contextFileIds,
        List<AiMessage> conversation
) {
    public String safeLanguage() {
        return language == null || language.isBlank() ? "plaintext" : language;
    }

    public String safeCode() {
        return code == null ? "" : code;
    }

    public String safeSelection() {
        return selection == null ? "" : selection;
    }

    public String safeInstruction() {
        return instruction == null ? "" : instruction;
    }
}
