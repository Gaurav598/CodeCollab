package com.collabcode.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
    @NotBlank(message = "Room code is required")
    String roomCode,

    @NotBlank(message = "Project name is required")
    @Size(max = 255, message = "Project name must not exceed 255 characters")
    String name
) {}
