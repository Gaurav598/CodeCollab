package com.collabcode.auth.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** SHA-256 hash of the raw reset token. Never store plaintext. */
    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected PasswordResetToken() {}

    public static PasswordResetToken create(User user, String hashedToken, Instant expiresAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.user = user;
        token.tokenHash = hashedToken;
        token.expiresAt = expiresAt;
        return token;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
}
