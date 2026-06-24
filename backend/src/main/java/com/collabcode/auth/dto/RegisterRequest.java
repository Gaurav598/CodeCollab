package com.collabcode.auth.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 30, message = "Username must be 3–30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username must be alphanumeric")
    String username,

    @NotBlank @Email(message = "Must be a valid email")
    String email,

    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
    String password
) {}
