# 03 — Database Design (PostgreSQL)

## Users
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial | PK |
| username | varchar, unique | |
| email | varchar, unique | |
| password_hash | varchar, nullable | null when auth via OAuth |
| provider | enum: `google`, `github`, `local` | |
| avatar_url | varchar, nullable | |
| created_at | timestamp | |

## Rooms
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| room_code | varchar, unique | shareable join code |
| owner_id | UUID | FK → Users.id |
| visibility | enum: `private`, `public` | |
| created_at | timestamp | |

## Room Members
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| room_id | UUID | FK → Rooms.id |
| user_id | UUID | FK → Users.id |
| role | enum: `owner`, `editor`, `viewer` | |
| joined_at | timestamp | |

## Projects
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| room_id | UUID | FK → Rooms.id |
| name | varchar | |
| created_at | timestamp | |

## Files
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → Projects.id |
| path | varchar | e.g. `src/index.js` |
| content | text | current snapshot; live state lives in the Yjs doc, this is the persisted checkpoint |
| language | varchar | for syntax highlighting / execution runtime selection |

## Messages
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| room_id | UUID | FK → Rooms.id |
| sender_id | UUID | FK → Users.id |
| message | text | |
| created_at | timestamp | |

## Sessions
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → Users.id |
| refresh_token | varchar, unique | hashed, not stored plaintext |
| expires_at | timestamp | |

## Notes
- `Room Members.role` is the source of truth for RBAC — see `04_AUTHENTICATION.md` for how it's enforced.
- `Files.content` is a periodic snapshot of the live Yjs document (see `06_CRDT_ENGINE.md`) — the CRDT engine is the source of truth while a room is active; this column is what gets read when a room is empty/cold and what gets restored into a fresh `Y.Doc` on the next join.
- Index recommendations: unique index on `(project_id, path)` in Files to prevent duplicate file paths within a project; index on `Room Members(room_id, user_id)` for fast permission checks.
- Cascade deletion policy: deleting a `Room` cascades to its `Room Members`, `Projects`, `Files`, and `Messages`. Project deletion cascades to its `Files`.
