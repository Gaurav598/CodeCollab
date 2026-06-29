package com.collabcode.chat.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.service.ChatService;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.service.RoomAccessService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import com.collabcode.chat.service.PresenceService;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Controller
public class StompController {

    private static final Logger logger = LoggerFactory.getLogger(StompController.class);

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

    private CollabUserDetails getUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            return (CollabUserDetails) auth.getPrincipal();
        }
        throw ApiException.unauthorized("INVALID_PRINCIPAL", "Invalid or missing authentication");
    }

    @MessageMapping("/chat.send")
    public void sendChat(@Payload Map<String, String> payload, Principal principal) {
        try {
            logger.info("Received chat.send with payload: {}", payload);
            CollabUserDetails user = getUser(principal);
            UUID roomId = parseUuid(payload.get("roomId"), "roomId");
            String message = payload.get("message");
            UUID messageId = payload.containsKey("id") && payload.get("id") != null ? parseUuid(payload.get("id"), "id") : null;

            ChatMessageDto savedMessage = chatService.saveMessage(messageId, roomId, user.getId(), message);

            logger.info("Broadcasting message to /topic/room.{}.chat", roomId);
            messagingTemplate.convertAndSend("/topic/room." + roomId + ".chat", savedMessage);
            logger.info("Broadcast successful");
        } catch (Exception e) {
            logger.error("Error processing chat.send", e);
            throw e;
        }
    }

    @MessageMapping("/chat.delete")
    public void deleteChat(@Payload Map<String, String> payload, Principal principal) {
        try {
            logger.info("Received chat.delete with payload: {}", payload);
            CollabUserDetails user = getUser(principal);
            UUID roomId = parseUuid(payload.get("roomId"), "roomId");
            UUID messageId = parseUuid(payload.get("messageId"), "messageId");

            ChatMessageDto deletedMessage = chatService.deleteMessage(roomId, messageId, user.getId());

            logger.info("Broadcasting message delete to /topic/room.{}.chat.delete", roomId);
            messagingTemplate.convertAndSend("/topic/room." + roomId + ".chat.delete", deletedMessage);
            logger.info("Delete Broadcast successful");
        } catch (Exception e) {
            logger.error("Error processing chat.delete", e);
            throw e;
        }
    }

    @MessageMapping("/room.join")
    public void joinRoom(@Payload Map<String, String> payload, Principal principal, org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        try {
            logger.info("Received room.join with payload: {}", payload);
            CollabUserDetails user = getUser(principal);
            UUID roomId = parseUuid(payload.get("roomId"), "roomId");
            roomAccessService.requireMember(roomId, user.getId());
            String sessionId = headerAccessor.getSessionId();
            if (sessionId == null) {
                throw ApiException.badRequest("INVALID_SESSION", "Missing WebSocket session id");
            }
            presenceService.userJoined(sessionId, roomId, user);
        } catch (Exception e) {
            logger.error("Error processing room.join", e);
            throw e;
        }
    }

    @MessageMapping("/room.leave")
    public void leaveRoom(@Payload Map<String, String> payload, Principal principal, org.springframework.messaging.simp.SimpMessageHeaderAccessor headerAccessor) {
        try {
            String sessionId = headerAccessor.getSessionId();
            presenceService.userLeft(sessionId);
        } catch (Exception e) {
            logger.error("Error processing room.leave", e);
            throw e;
        }
    }

    @MessageMapping("/webrtc.signal")
    public void routeSignal(@Payload Map<String, Object> payload, Principal principal) {
        try {
            CollabUserDetails user = getUser(principal);
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
        } catch (Exception e) {
            logger.error("Error processing webrtc.signal", e);
            throw e;
        }
    }

    private UUID parseUuid(String value, String fieldName) {
        try {
            return UUID.fromString(value);
        } catch (Exception ex) {
            throw ApiException.badRequest("INVALID_PAYLOAD", fieldName + " must be a valid UUID");
        }
    }
}
