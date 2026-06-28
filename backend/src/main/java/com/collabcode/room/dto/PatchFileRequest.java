package com.collabcode.room.dto;

import jakarta.validation.constraints.Size;

public record PatchFileRequest(
    @Size(max = 500, message = "Path must not exceed 500 characters")
    String path,
    String language,
    String content
) {}
