-- V1: Create Users and Sessions tables (Phase 2 — Authentication)

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(30)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    provider      VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);

CREATE TABLE sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id       ON sessions (user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions (refresh_token);
