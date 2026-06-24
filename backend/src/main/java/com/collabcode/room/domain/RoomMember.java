package com.collabcode.room.domain;

import com.collabcode.auth.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "user_id"}))
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.viewer;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    protected RoomMember() {}

    public static RoomMember create(Room room, User user, MemberRole role) {
        RoomMember m = new RoomMember();
        m.room = room;
        m.user = user;
        m.role = role;
        return m;
    }

    public UUID getId() { return id; }
    public Room getRoom() { return room; }
    public User getUser() { return user; }
    public MemberRole getRole() { return role; }
    public Instant getJoinedAt() { return joinedAt; }

    public void setRole(MemberRole role) { this.role = role; }
}
