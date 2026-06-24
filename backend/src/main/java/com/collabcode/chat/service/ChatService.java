package com.collabcode.chat.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.domain.Message;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.repository.MessageRepository;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.Room;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ChatService(MessageRepository messageRepository, RoomRepository roomRepository, UserRepository userRepository, NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ChatMessageDto saveMessage(UUID roomId, UUID senderId, String content) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));

        Message message = new Message();
        message.setRoom(room);
        message.setSender(sender);
        message.setContent(content);

        Message saved = messageRepository.save(message);
        
        // Parse mentions e.g., @gaurav
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("@([a-zA-Z0-9_]+)");
        java.util.regex.Matcher matcher = pattern.matcher(content);
        java.util.Set<String> mentionedUsernames = new java.util.HashSet<>();
        while (matcher.find()) {
            mentionedUsernames.add(matcher.group(1));
        }

        for (String username : mentionedUsernames) {
            userRepository.findByUsername(username).ifPresent(mentionedUser -> {
                if (!mentionedUser.getId().equals(sender.getId())) {
                    notificationService.createNotification(
                        mentionedUser.getId(),
                        "MENTION",
                        "New Mention",
                        sender.getUsername() + " mentioned you in a room: " + content
                    );
                }
            });
        }
        
        return ChatMessageDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getMessageHistory(UUID roomId, Pageable pageable) {
        return messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable)
                .map(ChatMessageDto::fromEntity);
    }
}
