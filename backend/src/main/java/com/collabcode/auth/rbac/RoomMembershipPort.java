package com.collabcode.auth.rbac;

/**
 * Interface to be implemented by any service that stores room membership.
 * Decoupled from the Room entity (Room is Phase 3).
 * The aspect calls this to resolve the caller's role before allowing access.
 */
public interface RoomMembershipPort {
    /**
     * Returns the role of the given user in the given room,
     * or null if the user is not a member.
     */
    RoomRole getRoleForUser(String roomCode, String userId);
}
