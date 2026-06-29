package com.collabcode.room.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "files")
@CompoundIndex(name = "room_path_idx", def = "{'room_id': 1, 'path': 1}", unique = true)
public class FileEntry {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("room_id")
    private UUID roomId;

    private String path;

    private String content = "";

    private String language = "plaintext";

    @Field("created_at")
    private Instant createdAt = Instant.now();

    protected FileEntry() {}

    public static FileEntry create(UUID roomId, String path, String language) {
        FileEntry f = new FileEntry();
        f.roomId = roomId;
        f.path = path;
        f.language = language;
        return f;
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public String getPath() { return path; }
    public String getContent() { return content; }
    public String getLanguage() { return language; }
    public Instant getCreatedAt() { return createdAt; }

    public void setPath(String path) { this.path = path; }
    public void setContent(String content) { this.content = content; }
    public void setLanguage(String language) { this.language = language; }
}
