package com.collabcode.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiMessage(
        @NotBlank String role,
        @NotBlank String content
) {}
