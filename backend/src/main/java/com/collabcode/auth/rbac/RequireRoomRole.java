package com.collabcode.auth.rbac;

import java.lang.annotation.*;

/**
 * Marks a controller method as requiring a minimum room role.
 * Enforced by RoomRoleAspect.
 *
 * Usage:
 *   @RequireRoomRole(RoomRole.editor)
 *   public ResponseEntity<?> editFile(@PathVariable String roomCode, ...) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRoomRole {
    RoomRole value();
}
