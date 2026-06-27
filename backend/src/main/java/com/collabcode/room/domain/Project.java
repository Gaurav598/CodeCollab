package com.collabcode.room.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "projects")
public class Project {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("room_id")
    @Indexed
    private UUID roomId;

    private String name;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    protected Project() {}

    public static Project create(UUID roomId, String name) {
        Project p = new Project();
        p.roomId = roomId;
        p.name = name;
        return p;
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public String getName() { return name; }
    public Instant getCreatedAt() { return createdAt; }

    public void setName(String name) { this.name = name; }
}
