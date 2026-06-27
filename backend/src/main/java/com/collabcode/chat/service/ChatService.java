package com.collabcode.chat.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.domain.Message;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.repository.MessageRepository;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 4_000;
    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9_]+)");

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RoomAccessService roomAccessService;

    public ChatService(MessageRepository messageRepository,
                       UserRepository userRepository,
                       NotificationService notificationService,
                       RoomAccessService roomAccessService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.roomAccessService = roomAccessService;
    }

    
    @Transactional
    public ChatMessageDto saveMessage(UUID roomId, UUID senderId, String content) {
        roomAccessService.requireMember(roomId, senderId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        String normalizedContent = normalizeMessage(content);

        Message message = new Message();
        message.setRoomId(roomId);
        message.setSenderId(senderId);
        message.setContent(normalizedContent);

        Message saved = messageRepository.save(message);
        
        java.util.regex.Matcher matcher = MENTION_PATTERN.matcher(normalizedContent);
        java.util.Set<String> mentionedUsernames = new java.util.HashSet<>();
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
        
        return ChatMessageDto.fromEntity(saved, sender.getUsername());
    }

    
    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getMessageHistory(UUID roomId, UUID userId, Pageable pageable) {
        roomAccessService.requireMember(roomId, userId);
        Page<Message> messagePage = messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable);
        
        java.util.Set<UUID> senderIds = messagePage.stream()
                .map(Message::getSenderId)
                .collect(java.util.stream.Collectors.toSet());
                
        java.util.Map<UUID, String> senderNames = new java.util.HashMap<>();
        userRepository.findAllById(senderIds).forEach(u -> senderNames.put(u.getId(), u.getUsername()));
        
        return messagePage.map(msg -> ChatMessageDto.fromEntity(msg, senderNames.getOrDefault(msg.getSenderId(), "Unknown User")));
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
