package com.collabcode.room.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "room_members")
@CompoundIndex(name = "room_user_idx", def = "{'room_id': 1, 'user_id': 1}", unique = true)
public class RoomMember {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("room_id")
    private UUID roomId;

    @Field("user_id")
    private UUID userId;

    private MemberRole role = MemberRole.viewer;

    @Field("joined_at")
    private Instant joinedAt = Instant.now();

    protected RoomMember() {}

    public static RoomMember create(UUID roomId, UUID userId, MemberRole role) {
        RoomMember m = new RoomMember();
        m.roomId = roomId;
        m.userId = userId;
        m.role = role;
        return m;
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public UUID getUserId() { return userId; }
    public MemberRole getRole() { return role; }
    public Instant getJoinedAt() { return joinedAt; }

    public void setRole(MemberRole role) { this.role = role; }
}
