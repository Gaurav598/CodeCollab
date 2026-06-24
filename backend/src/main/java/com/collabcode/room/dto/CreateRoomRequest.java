package com.collabcode.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateRoomRequest(
    @NotBlank(message = "Visibility is required")
    @Pattern(regexp = "public|private", message = "Visibility must be 'public' or 'private'")
    String visibility
) {}
