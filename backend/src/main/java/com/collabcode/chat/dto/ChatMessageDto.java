package com.collabcode.chat.dto;

import com.collabcode.chat.domain.Message;
import java.time.Instant;
import java.util.UUID;

public class ChatMessageDto {
    private UUID id;
    private UUID senderId;
    private String senderName;
    private String message;
    private Instant createdAt;
    private Instant editedAt;
    private boolean deleted;

    public static ChatMessageDto fromEntity(Message message, String senderName) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setSenderId(message.getSenderId());
        dto.setSenderName(senderName);
        dto.setMessage(message.isDeleted() ? "This message was deleted." : message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setEditedAt(message.getEditedAt());
        dto.setDeleted(message.isDeleted());
        return dto;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
