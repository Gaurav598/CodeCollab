package com.collabcode.auth.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "users")
public class User {

    @Id
    private UUID id = UUID.randomUUID();

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    @Field("password_hash")
    private String passwordHash;

    private AuthProvider provider = AuthProvider.local;

    @Field("avatar_url")
    private String avatarUrl;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    protected User() {}

    public static User createLocal(String username, String email, String passwordHash) {
        User u = new User();
        u.username = username;
        u.email = email;
        u.passwordHash = passwordHash;
        u.provider = AuthProvider.local;
        return u;
    }

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
