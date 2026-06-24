# 10 — Chat System

## Requirements
- Real-time chat within a room (delivered over the STOMP channel described in `05_REALTIME_COLLABORATION.md`)
- Emoji support in messages
- Message history (persisted to the `Messages` table — see `03_DATABASE_DESIGN.md` — and loaded when a user (re)joins a room)
- @mentions (tagging another room member by username, ideally triggering a notification)
- Notifications (in-app indicator for unread messages / mentions while a user is focused on the editor rather than the chat panel)

## Notes
- Chat is scoped per-room (not global/cross-room) — matches the `Messages.room_id` foreign key in the schema.
- Viewers (per the RBAC roles in `04_AUTHENTICATION.md`) should still be able to send/read chat even though they can't edit code — chat participation isn't gated by the Editor/Viewer distinction unless Gaurav decides otherwise later.
