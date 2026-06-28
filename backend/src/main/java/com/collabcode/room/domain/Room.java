package com.collabcode.room.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "rooms")
public class Room {

    @Id
    private UUID id = UUID.randomUUID();

    @Indexed(unique = true)
    @Field("room_code")
    private String roomCode;

    @Field("owner_id")
    private UUID ownerId;

    private RoomVisibility visibility = RoomVisibility.private_room;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    @Field("last_active_at")
    @Indexed
    private Instant lastActiveAt = Instant.now();

    protected Room() {}

    public static Room create(UUID ownerId, String roomCode, RoomVisibility visibility) {
        Room r = new Room();
        r.ownerId = ownerId;
        r.roomCode = roomCode;
        r.visibility = visibility;
        return r;
    }

    public UUID getId() { return id; }
    public String getRoomCode() { return roomCode; }
    public UUID getOwnerId() { return ownerId; }
    public RoomVisibility getVisibility() { return visibility; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastActiveAt() { return lastActiveAt; }

    public void updateLastActive() {
        this.lastActiveAt = Instant.now();
    }

    public boolean isPublic() { return visibility == RoomVisibility.public_room; }
}
