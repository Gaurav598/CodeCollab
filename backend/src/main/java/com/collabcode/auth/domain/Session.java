package com.collabcode.auth.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "sessions")
public class Session {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    /** SHA-256 hash of the raw refresh token. Never store plaintext. */
    @Indexed(unique = true)
    @Field("refresh_token")
    private String refreshToken;

    @Field("expires_at")
    private Instant expiresAt;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    protected Session() {}

    public static Session create(UUID userId, String hashedToken, Instant expiresAt) {
        Session s = new Session();
        s.userId = userId;
        s.refreshToken = hashedToken;
        s.expiresAt = expiresAt;
        return s;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getRefreshToken() { return refreshToken; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }

    /** Called on refresh rotation — replaces hash and extends expiry */
    public void rotate(String newHashedToken, Instant newExpiresAt) {
        this.refreshToken = newHashedToken;
        this.expiresAt = newExpiresAt;
    }
}
