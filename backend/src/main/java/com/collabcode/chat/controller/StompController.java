package com.collabcode.chat.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import com.collabcode.chat.service.PresenceService;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Controller
public class StompController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final com.collabcode.room.repository.RoomMemberRepository roomMemberRepository;

    public StompController(ChatService chatService, SimpMessagingTemplate messagingTemplate, PresenceService presenceService, com.collabcode.room.repository.RoomMemberRepository roomMemberRepository) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.presenceService = presenceService;
        this.roomMemberRepository = roomMemberRepository;
    }

    @MessageMapping("/chat.send")
    public void sendChat(@Payload Map<String, String> payload, @AuthenticationPrincipal CollabUserDetails user) {
        UUID roomId = UUID.fromString(payload.get("roomId"));
        String message = payload.get("message");

        // Save to DB
        ChatMessageDto savedMessage = chatService.saveMessage(roomId, user.getId(), message);

        // Broadcast to room
        messagingTemplate.convertAndSend("/topic/room." + roomId + ".chat", savedMessage);
    }

    @MessageMapping("/room.join")
    public void joinRoom(@Payload Map<String, String> payload, @AuthenticationPrincipal CollabUserDetails user, org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        UUID roomId = UUID.fromString(payload.get("roomId"));
        String sessionId = headerAccessor.getSessionId();
        presenceService.userJoined(sessionId, roomId, user);
    }

    @MessageMapping("/room.leave")
    public void leaveRoom(@Payload Map<String, String> payload, @AuthenticationPrincipal CollabUserDetails user, org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        presenceService.userLeft(sessionId);
    }

    @MessageMapping("/webrtc.signal")
    public void routeSignal(@Payload Map<String, Object> payload, @AuthenticationPrincipal CollabUserDetails user) {
        String targetUserId = (String) payload.get("targetUserId");
        UUID targetId = UUID.fromString(targetUserId);
        UUID roomId = UUID.fromString((String) payload.get("roomId"));

        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId()) ||
            !roomMemberRepository.existsByRoomIdAndUserId(roomId, targetId)) {
            throw new com.collabcode.common.exception.ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN", "Both users must be in the room");
        }

        Map<String, Object> forwardedPayload = Map.of(
            "senderId", user.getId().toString(),
            "type", payload.get("type"),
            "payload", payload.get("payload"),
            "roomId", roomId.toString()
        );

        // Send privately to the target user via /user/queue/webrtc.signal
        messagingTemplate.convertAndSendToUser(targetUserId, "/queue/webrtc.signal", forwardedPayload);
    }
}
