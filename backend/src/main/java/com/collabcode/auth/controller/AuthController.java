package com.collabcode.auth.controller;

import com.collabcode.auth.dto.LoginRequest;
import com.collabcode.auth.dto.PasswordResetConfirmRequest;
import com.collabcode.auth.dto.PasswordResetRequest;
import com.collabcode.auth.dto.RegisterRequest;
import com.collabcode.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /auth/register */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        Map<String, Object> body = authService.register(
                request.username(), request.email(), request.password(), response);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    /** POST /auth/login */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        Map<String, Object> body = authService.login(
                request.identifier(), request.password(), response);
        return ResponseEntity.ok(body);
    }

    /** POST /auth/refresh */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String accessToken = authService.refresh(request, response);
        return ResponseEntity.ok(Map.of("accessToken", accessToken));
    }

    /** POST /auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /** POST /auth/password-reset-request */
    @PostMapping("/password-reset-request")
    public ResponseEntity<Map<String, Object>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a reset link has been sent."));
    }

    /** POST /auth/password-reset */
    @PostMapping("/password-reset")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password successfully reset."));
    }

    /** GET /auth/me */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            HttpServletRequest request,
            HttpServletResponse response) {
        return ResponseEntity.ok(authService.me(request, response));
    }
}
