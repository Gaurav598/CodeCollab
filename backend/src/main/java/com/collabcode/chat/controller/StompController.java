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
import java.util.Set;

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

            // Viewers may observe documents but cannot join the media mesh or
            // use signaling as an arbitrary relay.
            roomAccessService.requireEditor(roomId, user.getId());
            roomAccessService.requireEditor(roomId, targetId);
            if (user.getId().equals(targetId)) {
                throw ApiException.badRequest("INVALID_PAYLOAD", "Cannot signal yourself");
            }
            String type = payload.get("type") instanceof String value ? value : "";
            if (!Set.of("OFFER", "ANSWER", "ICE").contains(type)) {
                throw ApiException.badRequest("INVALID_PAYLOAD", "Unsupported WebRTC signal type");
            }
            Object signalPayload = payload.get("payload");
            if (signalPayload == null || signalPayload.toString().length() > 131_072) {
                throw ApiException.badRequest("INVALID_PAYLOAD", "WebRTC signal payload is missing or too large");
            }

            Map<String, Object> forwardedPayload = Map.of(
                "senderId", user.getId().toString(),
                "type", type,
                "payload", signalPayload,
                "roomId", roomId.toString()
            );

            messagingTemplate.convertAndSendToUser(targetUserId, "/queue/webrtc.signal", forwardedPayload);
        } catch (Exception e) {
            logger.error("Error processing webrtc.signal", e);
            throw e;
        }
    }

    @MessageMapping("/video.presence")
    public void videoPresence(@Payload Map<String, Object> payload, Principal principal) {
        CollabUserDetails user = getUser(principal);
        UUID roomId = parseUuid((String) payload.get("roomId"), "roomId");
        roomAccessService.requireEditor(roomId, user.getId());

        String type = payload.get("type") instanceof String value ? value : "";
        Set<String> allowedTypes = Set.of(
                "JOINED", "PRESENT", "LEFT", "MEDIA_STATE", "VIDEO_STATE",
                "SCREEN_SHARE_START", "SCREEN_SHARE_STOP");
        if (!allowedTypes.contains(type)) {
            throw ApiException.badRequest("INVALID_PAYLOAD", "Unsupported video presence event");
        }

        Map<String, Object> forwarded = new java.util.HashMap<>();
        forwarded.put("roomId", roomId.toString());
        forwarded.put("userId", user.getId().toString());
        forwarded.put("type", type);
        if (payload.get("isVideoMuted") instanceof Boolean value) forwarded.put("isVideoMuted", value);
        if (payload.get("isAudioMuted") instanceof Boolean value) forwarded.put("isAudioMuted", value);
        messagingTemplate.convertAndSend("/topic/room." + roomId + ".video.presence", forwarded);
    }

    private UUID parseUuid(String value, String fieldName) {
        try {
            return UUID.fromString(value);
        } catch (Exception ex) {
            throw ApiException.badRequest("INVALID_PAYLOAD", fieldName + " must be a valid UUID");
        }
    }
}
