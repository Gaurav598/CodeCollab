package com.collabcode.auth.security;

import com.collabcode.auth.domain.User;
import com.collabcode.config.SecurityProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates short-lived JWT access tokens.
 * Claims: sub (user UUID), username, email.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationSeconds;

    public JwtTokenProvider(SecurityProperties props) {
        this.signingKey = Keys.hmacShaKeyFor(
                props.getJwtSecret().getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = props.getJwtExpirationSeconds();
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }
}
