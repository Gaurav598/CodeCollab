package com.collabcode.chat.controller;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class PresenceRestController {

    private final PresenceService presenceService;
    private final UserRepository userRepository;

    public PresenceRestController(PresenceService presenceService, UserRepository userRepository) {
        this.presenceService = presenceService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{roomId}/presence")
    public ResponseEntity<List<Map<String, String>>> getActivePresence(@PathVariable UUID roomId) {
        Set<UUID> activeUserIds = presenceService.getActiveUsersInRoom(roomId);
        
        List<Map<String, String>> roster = activeUserIds.stream()
            .map(id -> userRepository.findById(id))
            .filter(java.util.Optional::isPresent)
            .map(java.util.Optional::get)
            .map(user -> Map.of(
                "userId", user.getId().toString(),
                "username", user.getUsername(),
                "status", "JOINED"
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(roster);
    }
}
