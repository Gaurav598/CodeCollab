package com.collabcode.room.domain;

import com.collabcode.auth.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_code", nullable = false, unique = true, length = 12)
    private String roomCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomVisibility visibility = RoomVisibility.private_room;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Room() {}

    public static Room create(User owner, String roomCode, RoomVisibility visibility) {
        Room r = new Room();
        r.owner = owner;
        r.roomCode = roomCode;
        r.visibility = visibility;
        return r;
    }

    public UUID getId() { return id; }
    public String getRoomCode() { return roomCode; }
    public User getOwner() { return owner; }
    public RoomVisibility getVisibility() { return visibility; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isPublic() { return visibility == RoomVisibility.public_room; }
}
