package com.collabcode.auth.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    /** SHA-256 hash of the raw reset token. Never store plaintext. */
    @Indexed(unique = true)
    @Field("token_hash")
    private String tokenHash;

    @Field("expires_at")
    private Instant expiresAt;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    protected PasswordResetToken() {}

    public static PasswordResetToken create(UUID userId, String hashedToken, Instant expiresAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.userId = userId;
        token.tokenHash = hashedToken;
        token.expiresAt = expiresAt;
        return token;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
}
