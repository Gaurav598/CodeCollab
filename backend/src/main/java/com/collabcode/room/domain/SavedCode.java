package com.collabcode.room.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "saved_codes")
public class SavedCode {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("user_id")
    private UUID userId;

    @Field("room_code")
    private String roomCode;

    @Field("file_name")
    private String fileName;

    private String language;

    private String code;

    @Field("saved_at")
    private Instant savedAt = Instant.now();

    @Field("updated_at")
    private Instant updatedAt = Instant.now();

    protected SavedCode() {}

    public static SavedCode create(UUID userId, String roomCode, String fileName, String language, String code) {
        SavedCode sc = new SavedCode();
        sc.userId = userId;
        sc.roomCode = roomCode;
        sc.fileName = fileName;
        sc.language = language;
        sc.code = code;
        return sc;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getRoomCode() { return roomCode; }
    public String getFileName() { return fileName; }
    public String getLanguage() { return language; }
    public String getCode() { return code; }
    public Instant getSavedAt() { return savedAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setLanguage(String language) { this.language = language; }
    public void setCode(String code) { 
        this.code = code; 
        this.updatedAt = Instant.now();
    }
}
