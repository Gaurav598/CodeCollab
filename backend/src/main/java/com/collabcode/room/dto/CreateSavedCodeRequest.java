package com.collabcode.room.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSavedCodeRequest(
        @NotBlank String roomCode,
        @NotBlank String fileName,
        @NotBlank String language,
        String code
) {
}
