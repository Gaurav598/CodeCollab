package com.collabcode.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateFileRequest(
    @NotNull(message = "Project ID is required")
    UUID projectId,

    @NotBlank(message = "Path is required")
    @Size(max = 500, message = "Path must not exceed 500 characters")
    String path,

    String language
) {
    public String languageOrDefault() {
        return (language == null || language.isBlank()) ? "plaintext" : language;
    }
}
