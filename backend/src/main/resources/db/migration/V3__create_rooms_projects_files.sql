-- V3: Rooms, Room Members, Projects, Files (Phase 3 — CRDT Collaboration)

-- Rooms
CREATE TABLE rooms (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code   VARCHAR(12) NOT NULL UNIQUE,
    owner_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    visibility  VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_owner_id  ON rooms (owner_id);
CREATE INDEX idx_rooms_room_code ON rooms (room_code);

-- Room Members
CREATE TABLE room_members (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, user_id)
);

CREATE INDEX idx_room_members_room_id      ON room_members (room_id);
CREATE INDEX idx_room_members_user_id      ON room_members (user_id);
CREATE INDEX idx_room_members_room_user    ON room_members (room_id, user_id);

-- Projects
CREATE TABLE projects (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_room_id ON projects (room_id);

-- Files
CREATE TABLE files (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    path       VARCHAR(500) NOT NULL,
    content    TEXT        NOT NULL DEFAULT '',
    language   VARCHAR(50) NOT NULL DEFAULT 'plaintext',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, path)
);

CREATE INDEX idx_files_project_id ON files (project_id);
CREATE UNIQUE INDEX idx_files_project_path ON files (project_id, path);
