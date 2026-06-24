package com.collabcode.execution.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RunCodeRequest(
        @NotNull UUID fileId,
        @NotBlank @Size(max = 65536) String code,
        @NotBlank String language,
        @Size(max = 8192) String stdin
) {
    public RunCodeRequest {
        if (stdin == null) stdin = "";
    }
}
