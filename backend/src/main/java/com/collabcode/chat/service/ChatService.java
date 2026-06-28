package com.collabcode.chat.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

/**
 * Ephemeral chat service — messages are stored in-memory only.
 * No MongoDB persistence. Messages are cleared when the room becomes empty.
 */
@Service
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 4_000;
    private static final int MAX_HISTORY_SIZE = 200;
    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9_]+)");

    /** In-memory store: roomId -> list of chat messages (newest last) */
    private final Map<UUID, CopyOnWriteArrayList<ChatMessageDto>> roomMessages = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RoomAccessService roomAccessService;

    public ChatService(UserRepository userRepository,
                       NotificationService notificationService,
                       RoomAccessService roomAccessService) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.roomAccessService = roomAccessService;
    }

    public ChatMessageDto saveMessage(UUID roomId, UUID senderId, String content) {
        roomAccessService.requireMember(roomId, senderId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        String normalizedContent = normalizeMessage(content);

        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(UUID.randomUUID());
        dto.setSenderId(senderId);
        dto.setSenderName(sender.getUsername());
        dto.setMessage(normalizedContent);
        dto.setCreatedAt(Instant.now());
        dto.setDeleted(false);

        roomMessages.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(dto);

        // Cap the in-memory list to avoid unbounded growth
        CopyOnWriteArrayList<ChatMessageDto> list = roomMessages.get(roomId);
        if (list != null && list.size() > MAX_HISTORY_SIZE) {
            list.remove(0);
        }

        // Handle @mentions
        java.util.regex.Matcher matcher = MENTION_PATTERN.matcher(normalizedContent);
        Set<String> mentionedUsernames = new HashSet<>();
        while (matcher.find()) {
            mentionedUsernames.add(matcher.group(1));
        }

        userRepository.findAllByUsernameIn(mentionedUsernames).stream()
                .filter(mentionedUser -> !mentionedUser.getId().equals(sender.getId()))
                .forEach(mentionedUser -> notificationService.createNotification(
                    mentionedUser.getId(),
                    "MENTION",
                    "New Mention",
                    sender.getUsername() + " mentioned you in a room: " + normalizedContent
                ));

        return dto;
    }

    public List<ChatMessageDto> getMessageHistory(UUID roomId, UUID userId) {
        roomAccessService.requireMember(roomId, userId);
        List<ChatMessageDto> messages = roomMessages.get(roomId);
        if (messages == null) return Collections.emptyList();
        return Collections.unmodifiableList(messages);
    }

    /**
     * Called by PresenceService when the last user leaves a room.
     * Clears all ephemeral messages for that room.
     */
    public void clearRoomMessages(UUID roomId) {
        roomMessages.remove(roomId);
    }

    private String normalizeMessage(String content) {
        if (content == null || content.isBlank()) {
            throw ApiException.badRequest("EMPTY_MESSAGE", "Message cannot be empty");
        }
        String normalized = content.trim();
        if (normalized.length() > MAX_MESSAGE_LENGTH) {
            throw ApiException.badRequest("MESSAGE_TOO_LONG", "Message is too long");
        }
        return normalized;
    }
}

