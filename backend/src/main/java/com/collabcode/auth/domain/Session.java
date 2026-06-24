package com.collabcode.auth.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** SHA-256 hash of the raw refresh token. Never store plaintext. */
    @Column(name = "refresh_token", nullable = false, unique = true)
    private String refreshToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Session() {}

    public static Session create(User user, String hashedToken, Instant expiresAt) {
        Session s = new Session();
        s.user = user;
        s.refreshToken = hashedToken;
        s.expiresAt = expiresAt;
        return s;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getRefreshToken() { return refreshToken; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }

    /** Called on refresh rotation — replaces hash and extends expiry */
    public void rotate(String newHashedToken, Instant newExpiresAt) {
        this.refreshToken = newHashedToken;
        this.expiresAt = newExpiresAt;
    }
}
