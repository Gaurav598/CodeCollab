package com.collabcode.chat.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.service.PresenceService;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/chat")
public class PresenceRestController {

    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final RoomAccessService roomAccessService;

    public PresenceRestController(PresenceService presenceService,
                                  UserRepository userRepository,
                                  RoomAccessService roomAccessService) {
        this.presenceService = presenceService;
        this.userRepository = userRepository;
        this.roomAccessService = roomAccessService;
    }

    @GetMapping("/{roomId}/presence")
    public ResponseEntity<List<Map<String, String>>> getActivePresence(@PathVariable UUID roomId,
                                                                       @AuthenticationPrincipal CollabUserDetails userDetails) {
        roomAccessService.requireMember(roomId, userDetails.getId());
        Set<UUID> activeUserIds = presenceService.getActiveUsersInRoom(roomId);

        List<Map<String, String>> roster = StreamSupport.stream(userRepository.findAllById(activeUserIds).spliterator(), false)
            .map(user -> Map.of(
                "userId", user.getId().toString(),
                "username", user.getUsername(),
                "status", "JOINED"
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(roster);
    }
}
