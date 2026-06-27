package com.collabcode.chat.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "messages")
public class Message {

    @Id
    private UUID id = UUID.randomUUID();

    @Field("room_id")
    @Indexed
    private UUID roomId;

    @Field("sender_id")
    @Indexed
    private UUID senderId;

    private String content;

    @Field("created_at")
    @Indexed
    private Instant createdAt = Instant.now();

    @Field("edited_at")
    private Instant editedAt;

    private boolean deleted = false;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
    
    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }
    
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
