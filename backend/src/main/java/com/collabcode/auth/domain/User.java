package com.collabcode.auth.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider = AuthProvider.local;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected User() {}

    // Factory: local registration
    public static User createLocal(String username, String email, String passwordHash) {
        User u = new User();
        u.username = username;
        u.email = email;
        u.passwordHash = passwordHash;
        u.provider = AuthProvider.local;
        return u;
    }

    // Factory: OAuth
    public static User createOAuth(String username, String email, String avatarUrl, AuthProvider provider) {
        User u = new User();
        u.username = username;
        u.email = email;
        u.provider = provider;
        u.avatarUrl = avatarUrl;
        return u;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public AuthProvider getProvider() { return provider; }
    public String getAvatarUrl() { return avatarUrl; }
    public Instant getCreatedAt() { return createdAt; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
