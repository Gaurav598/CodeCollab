package com.collabcode.chat.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.service.ChatService;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import com.collabcode.chat.service.PresenceService;

import java.util.Map;
import java.util.UUID;

@Controller
public class StompController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final RoomAccessService roomAccessService;

    public StompController(ChatService chatService,
                           SimpMessagingTemplate messagingTemplate,
                           PresenceService presenceService,
                           RoomAccessService roomAccessService) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.presenceService = presenceService;
        this.roomAccessService = roomAccessService;
    }

    @MessageMapping("/chat.send")
    public void sendChat(@Payload Map<String, String> payload, @AuthenticationPrincipal CollabUserDetails user) {
        UUID roomId = parseUuid(payload.get("roomId"), "roomId");
        String message = payload.get("message");

        ChatMessageDto savedMessage = chatService.saveMessage(roomId, user.getId(), message);

        messagingTemplate.convertAndSend("/topic/room." + roomId + ".chat", savedMessage);
    }

    @MessageMapping("/room.join")
    public void joinRoom(@Payload Map<String, String> payload, @AuthenticationPrincipal CollabUserDetails user, org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        UUID roomId = parseUuid(payload.get("roomId"), "roomId");
        roomAccessService.requireMember(roomId, user.getId());
        String sessionId = headerAccessor.getSessionId();
        if (sessionId == null) {
            throw ApiException.badRequest("INVALID_SESSION", "Missing WebSocket session id");
        }
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
        UUID targetId = parseUuid(targetUserId, "targetUserId");
        UUID roomId = parseUuid((String) payload.get("roomId"), "roomId");

        roomAccessService.requireMember(roomId, user.getId());
        roomAccessService.requireMember(roomId, targetId);

        Map<String, Object> forwardedPayload = Map.of(
            "senderId", user.getId().toString(),
            "type", payload.get("type"),
            "payload", payload.get("payload"),
            "roomId", roomId.toString()
        );

        messagingTemplate.convertAndSendToUser(targetUserId, "/queue/webrtc.signal", forwardedPayload);
    }

    private UUID parseUuid(String value, String fieldName) {
        try {
            return UUID.fromString(value);
        } catch (Exception ex) {
            throw ApiException.badRequest("INVALID_PAYLOAD", fieldName + " must be a valid UUID");
        }
    }
}
