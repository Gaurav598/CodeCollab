package com.collabcode.room.controller;

import com.collabcode.auth.security.UserDetailsServiceImpl;
import com.collabcode.room.dto.CreateRoomRequest;
import com.collabcode.room.dto.PatchMemberRequest;
import com.collabcode.room.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;
    private final UserDetailsServiceImpl userDetailsService;

    public RoomController(RoomService roomService, UserDetailsServiceImpl userDetailsService) {
        this.roomService = roomService;
        this.userDetailsService = userDetailsService;
    }

    /** POST /rooms */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(userId(principal), request.visibility()));
    }

    /** GET /rooms/:roomCode */
    @GetMapping("/{roomCode}")
    public ResponseEntity<Map<String, Object>> getRoom(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.getRoom(roomCode, userId(principal)));
    }

    /** POST /rooms/:roomCode/join */
    @PostMapping("/{roomCode}/join")
    public ResponseEntity<Map<String, Object>> joinRoom(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.joinRoom(roomCode, userId(principal)));
    }

    /** POST /rooms/:roomCode/leave */
    @PostMapping("/{roomCode}/leave")
    public ResponseEntity<Map<String, Object>> leaveRoom(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.leaveRoom(roomCode, userId(principal));
        return ResponseEntity.ok(Map.of("message", "Left room"));
    }

    /** PATCH /rooms/:roomCode/members/:userId */
    @PatchMapping("/{roomCode}/members/{targetUserId}")
    public ResponseEntity<Map<String, Object>> patchMember(
            @PathVariable String roomCode,
            @PathVariable UUID targetUserId,
            @Valid @RequestBody PatchMemberRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.patchMember(roomCode, targetUserId, request.role(), userId(principal)));
    }

    /** DELETE /rooms/:roomCode/members/:userId */
    @DeleteMapping("/{roomCode}/members/{targetUserId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable String roomCode,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.removeMember(roomCode, targetUserId, userId(principal));
        return ResponseEntity.ok(Map.of("message", "Member removed"));
    }

    /** DELETE /rooms/:roomCode */
    @DeleteMapping("/{roomCode}")
    public ResponseEntity<Map<String, Object>> deleteRoom(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.deleteRoom(roomCode, userId(principal));
        return ResponseEntity.ok(Map.of("message", "Room deleted"));
    }

    private UUID userId(UserDetails principal) {
        return ((com.collabcode.auth.security.CollabUserDetails) principal).getId();
    }
}
