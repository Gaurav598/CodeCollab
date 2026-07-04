package com.collabcode.auth.service;

import com.collabcode.auth.domain.AuthProvider;
import com.collabcode.auth.domain.PasswordResetToken;
import com.collabcode.auth.domain.Session;
import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.PasswordResetTokenRepository;
import com.collabcode.auth.repository.SessionRepository;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.auth.security.JwtTokenProvider;
import com.collabcode.common.exception.ApiException;
import com.collabcode.config.SecurityProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;

@Service
public class AuthService {

    static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityProperties securityProperties;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       SessionRepository sessionRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       SecurityProperties securityProperties) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.securityProperties = securityProperties;
    }

    // ──────────────────────────────────────────────
    // Register
    // ──────────────────────────────────────────────
    
    @Transactional
    public Map<String, Object> register(String username, String email, String rawPassword,
                                        HttpServletResponse response) {
        String normalizedUsername = username.trim();
        String normalizedEmail = normalizeEmail(email);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict("USER_ALREADY_EXISTS", "Email already in use");
        }
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw ApiException.conflict("USER_ALREADY_EXISTS", "Username already taken");
        }
        String hash = passwordEncoder.encode(rawPassword);
        User user = userRepository.save(User.createLocal(normalizedUsername, normalizedEmail, hash));
        return buildAuthResponse(user, response);
    }

    // ──────────────────────────────────────────────
    // Login
    // ──────────────────────────────────────────────
    
    @Transactional
    public Map<String, Object> login(String identifier, String rawPassword,
                                     HttpServletResponse response) {
        String normalizedIdentifier = identifier.trim();
        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(normalizedIdentifier, normalizedIdentifier)
                .orElseThrow(() -> ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid credentials"));
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid credentials");
        }
        return buildAuthResponse(user, response);
    }

    // ──────────────────────────────────────────────
    // Refresh (cookie-based, rotates token)
    // ──────────────────────────────────────────────
    
    @Transactional
    public String refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request);
        String hashed = hash(rawToken);
        Session session = sessionRepository.findByRefreshToken(hashed)
                .orElseThrow(() -> ApiException.unauthorized("TOKEN_EXPIRED", "Session not found or expired"));
        if (session.isExpired()) {
            sessionRepository.delete(session);
            throw ApiException.unauthorized("TOKEN_EXPIRED", "Refresh token expired");
        }
        // Rotate
        String newRaw = generateRawToken();
        session.rotate(hash(newRaw), Instant.now().plus(
                securityProperties.getRefreshTokenExpirationDays(), ChronoUnit.DAYS));
        setRefreshCookie(response, newRaw);
        User sessionUser = userRepository.findById(session.getUserId())
            .orElseThrow(() -> ApiException.unauthorized("TOKEN_EXPIRED", "Session user not found"));
        return jwtTokenProvider.generateAccessToken(sessionUser);
    }

    // ──────────────────────────────────────────────
    // Logout
    // ──────────────────────────────────────────────
    
    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            String rawToken = extractRefreshCookie(request);
            String hashed = hash(rawToken);
            sessionRepository.findByRefreshToken(hashed).ifPresent(sessionRepository::delete);
        } catch (ApiException ignored) {
            // cookie missing — still clear it
        }
        clearRefreshCookie(response);
    }

    // ──────────────────────────────────────────────
    // Password Reset
    // ──────────────────────────────────────────────
    
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(normalizeEmail(email)).ifPresent(user -> {
            String rawToken = generateRawToken();
            String hashed = hash(rawToken);
            Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);
            PasswordResetToken resetToken = PasswordResetToken.create(user.getId(), hashed, expiresAt);
            passwordResetTokenRepository.save(resetToken);
        });
    }

    
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String hashed = hash(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashed)
                .orElseThrow(() -> ApiException.badRequest("INVALID_TOKEN", "Invalid or expired token"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw ApiException.badRequest("INVALID_TOKEN", "Invalid or expired token");
        }

        User user = userRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> ApiException.badRequest("INVALID_TOKEN", "User no longer exists"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate all active sessions (logout everywhere)
        sessionRepository.deleteAllByUserId(user.getId());
        passwordResetTokenRepository.delete(resetToken);
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.badRequest("USER_NOT_FOUND", "User not found"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("INVALID_PASSWORD", "Invalid current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ──────────────────────────────────────────────
    // /auth/me — restore session
    // ──────────────────────────────────────────────
    
    @Transactional(readOnly = true)
    public Map<String, Object> me(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request);
        String hashed = hash(rawToken);
        Session session = sessionRepository.findByRefreshToken(hashed)
                .orElseThrow(() -> ApiException.unauthorized("UNAUTHENTICATED", "No valid session"));
        if (session.isExpired()) {
            throw ApiException.unauthorized("UNAUTHENTICATED", "Session expired");
        }
        User user = userRepository.findById(session.getUserId())
            .orElseThrow(() -> ApiException.unauthorized("UNAUTHENTICATED", "User not found"));
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        return Map.of("user", userDto(user), "accessToken", accessToken);
    }

    // ──────────────────────────────────────────────
    // Package-level helper: issue cookie for OAuth flow
    // ──────────────────────────────────────────────
    
    public void issueRefreshCookie(HttpServletResponse response, User user) {
        String rawToken = generateRawToken();
        Instant expiresAt = Instant.now().plus(
                securityProperties.getRefreshTokenExpirationDays(), ChronoUnit.DAYS);
        Session session = Session.create(user.getId(), hash(rawToken), expiresAt);
        sessionRepository.save(session);
        setRefreshCookie(response, rawToken);
    }

    // ──────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────
    private Map<String, Object> buildAuthResponse(User user, HttpServletResponse response) {
        issueRefreshCookie(response, user);
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        return Map.of("user", userDto(user), "accessToken", accessToken);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw ApiException.unauthorized("UNAUTHENTICATED", "No refresh token cookie");
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> ApiException.unauthorized("UNAUTHENTICATED", "No refresh token cookie"));
    }

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        long maxAgeSeconds = securityProperties.getRefreshTokenExpirationDays() * 86400;
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(securityProperties.isRefreshCookieSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(securityProperties.isRefreshCookieSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    static Map<String, Object> userDto(User user) {
        return Map.of(
                "id", user.getId().toString(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "avatar_url", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "provider", user.getProvider().name()
        );
    }
}
