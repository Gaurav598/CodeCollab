package com.collabcode.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PatchMemberRequest(
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "owner|editor|viewer", message = "Role must be 'owner', 'editor', or 'viewer'")
    String role
) {}
