package com.collabcode.ai.dto;

public record AiContextFile(
        String fileId,
        String path,
        String language,
        String content
) {}
