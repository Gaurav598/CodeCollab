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

    // RoomId -> UserId -> active STOMP session ids. Multiple tabs for one user
    // must not make the user disappear when only one tab disconnects.
    private final Map<UUID, Map<UUID, Set<String>>> roomUserSessions = new ConcurrentHashMap<>();
    
    // SessionId -> UserDetails
    private final Map<String, CollabUserDetails> sessionUsers = new ConcurrentHashMap<>();
    
    // SessionId -> RoomId
    private final Map<String, UUID> sessionRooms = new ConcurrentHashMap<>();

    public PresenceService(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    public void userJoined(String sessionId, UUID roomId, CollabUserDetails user) {
        UUID previousRoom = sessionRooms.get(sessionId);
        if (previousRoom != null && !previousRoom.equals(roomId)) userLeft(sessionId);
        sessionUsers.put(sessionId, user);
        sessionRooms.put(sessionId, roomId);

        Set<String> sessions = roomUserSessions
                .computeIfAbsent(roomId, ignored -> new ConcurrentHashMap<>())
                .computeIfAbsent(user.getId(), ignored -> ConcurrentHashMap.newKeySet());
        boolean firstSession = sessions.isEmpty();
        sessions.add(sessionId);
        if (firstSession) broadcastPresence(roomId, user, "JOINED");
    }

    public void userLeft(String sessionId) {
        CollabUserDetails user = sessionUsers.remove(sessionId);
        UUID roomId = sessionRooms.remove(sessionId);

        if (user != null && roomId != null) {
            Map<UUID, Set<String>> usersInRoom = roomUserSessions.get(roomId);
            if (usersInRoom != null) {
                Set<String> sessions = usersInRoom.get(user.getId());
                if (sessions != null) sessions.remove(sessionId);
                boolean lastUserSession = sessions == null || sessions.isEmpty();
                if (lastUserSession) {
                    usersInRoom.remove(user.getId());
                    broadcastPresence(roomId, user, "LEFT");
                }
                if (usersInRoom.isEmpty()) {
                    roomUserSessions.remove(roomId);
                    // Clear ephemeral chat messages when the last user leaves
                    chatService.clearRoomMessages(roomId);
                }
            }
        }
    }

    public Set<UUID> getActiveUsersInRoom(UUID roomId) {
        Map<UUID, Set<String>> users = roomUserSessions.get(roomId);
        return users == null ? Set.of() : Set.copyOf(users.keySet());
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
