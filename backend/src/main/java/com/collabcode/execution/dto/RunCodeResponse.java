package com.collabcode.execution.dto;

public record RunCodeResponse(
        String stdout,
        String stderr,
        int exitCode,
        long executionTimeMs
) {}
