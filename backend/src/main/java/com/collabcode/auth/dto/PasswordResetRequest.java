package com.collabcode.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email")
    String email
) {}
