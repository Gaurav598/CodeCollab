package com.collabcode.chat.service;

import com.collabcode.auth.security.CollabUserDetails;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    // RoomId -> Set of UserIds
    private final Map<UUID, Set<UUID>> roomUsers = new ConcurrentHashMap<>();
    
    // SessionId -> UserDetails
    private final Map<String, CollabUserDetails> sessionUsers = new ConcurrentHashMap<>();
    
    // SessionId -> RoomId
    private final Map<String, UUID> sessionRooms = new ConcurrentHashMap<>();

    public PresenceService(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    public void userJoined(String sessionId, UUID roomId, CollabUserDetails user) {
        sessionUsers.put(sessionId, user);
        sessionRooms.put(sessionId, roomId);

        roomUsers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(user.getId());

        broadcastPresence(roomId, user, "JOINED");
    }

    public void userLeft(String sessionId) {
        CollabUserDetails user = sessionUsers.remove(sessionId);
        UUID roomId = sessionRooms.remove(sessionId);

        if (user != null && roomId != null) {
            Set<UUID> usersInRoom = roomUsers.get(roomId);
            if (usersInRoom != null) {
                usersInRoom.remove(user.getId());
                if (usersInRoom.isEmpty()) {
                    roomUsers.remove(roomId);
                    // Clear ephemeral chat messages when the last user leaves
                    chatService.clearRoomMessages(roomId);
                }
            }
            broadcastPresence(roomId, user, "LEFT");
        }
    }

    public Set<UUID> getActiveUsersInRoom(UUID roomId) {
        return roomUsers.getOrDefault(roomId, Set.of());
    }

    private void broadcastPresence(UUID roomId, CollabUserDetails user, String status) {
        Map<String, Object> presenceEvent = Map.of(
            "userId", user.getId().toString(),
            "username", user.getUsername(),
            "status", status,
            "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/room." + roomId + ".presence", presenceEvent);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        if (sessionId != null) {
            userLeft(sessionId);
        }
    }
}

