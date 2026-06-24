package com.collabcode.auth.rbac;

/**
 * Room-scoped roles. Matches the `role` enum in the `room_members` table.
 * See 04_AUTHENTICATION.md for the permission matrix.
 */
public enum RoomRole {
    owner,
    editor,
    viewer
}
