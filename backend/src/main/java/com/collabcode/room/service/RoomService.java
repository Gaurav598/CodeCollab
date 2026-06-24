package com.collabcode.room.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

@Service
public class RoomService {

    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final int CODE_LENGTH = 8;

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomService(RoomRepository roomRepository,
                       RoomMemberRepository roomMemberRepository,
                       UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> createRoom(UUID ownerId, String visibilityStr) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        String code = generateUniqueCode();
        RoomVisibility visibility = visibilityStr.equals("public")
                ? RoomVisibility.public_room : RoomVisibility.private_room;
        Room room = roomRepository.save(Room.create(owner, code, visibility));
        // Add the creator as owner
        roomMemberRepository.save(RoomMember.create(room, owner, MemberRole.owner));
        return roomDto(room);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRoom(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        if (!room.isPublic()) {
            boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(room.getId(), requestingUserId);
            if (!isMember) {
                throw ApiException.forbidden("FORBIDDEN", "Access denied to private room");
            }
        }
        return roomDto(room);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserRooms(UUID userId) {
        return roomMemberRepository.findAllByUserId(userId).stream()
                .map(member -> {
                    Map<String, Object> dto = new HashMap<>(roomDto(member.getRoom()));
                    dto.put("role", member.getRole().name());
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRoomMembers(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        requireMember(room.getId(), requestingUserId);
        return roomMemberRepository.findAllByRoomId(room.getId()).stream()
                .map(member -> Map.<String, Object>of(
                        "userId", member.getUser().getId().toString(),
                        "username", member.getUser().getUsername(),
                        "role", member.getRole().name()
                ))
                .toList();
    }

    @Transactional
    public Map<String, Object> joinRoom(String roomCode, UUID userId) {
        Room room = findByCode(roomCode);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));

        if (roomMemberRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
            return Map.of("message", "Already a member");
        }
        if (!room.isPublic()) {
            throw ApiException.forbidden("FORBIDDEN", "Cannot join a private room without an invitation");
        }
        roomMemberRepository.save(RoomMember.create(room, user, MemberRole.viewer));
        return Map.of("message", "Joined room", "roomCode", roomCode, "role", "viewer");
    }

    @Transactional
    public void leaveRoom(String roomCode, UUID userId) {
        Room room = findByCode(roomCode);
        if (room.getOwner().getId().equals(userId)) {
            throw ApiException.badRequest("OWNER_CANNOT_LEAVE", "Owner cannot leave a room; delete or transfer ownership first.");
        }
        roomMemberRepository.deleteByRoomIdAndUserId(room.getId(), userId);
    }

    @Transactional
    public Map<String, Object> patchMember(String roomCode, UUID targetUserId, String roleStr, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        requireOwner(room.getId(), requestingUserId);
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(room.getId(), targetUserId)
                .orElseThrow(() -> ApiException.notFound("MEMBER_NOT_FOUND", "User is not a member of this room"));
        MemberRole newRole = MemberRole.valueOf(roleStr);
        member.setRole(newRole);
        roomMemberRepository.save(member);
        return Map.of("userId", targetUserId, "role", newRole.name());
    }

    @Transactional
    public void removeMember(String roomCode, UUID targetUserId, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        requireOwner(room.getId(), requestingUserId);
        roomMemberRepository.deleteByRoomIdAndUserId(room.getId(), targetUserId);
    }

    @Transactional
    public void deleteRoom(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        requireOwner(room.getId(), requestingUserId);
        roomRepository.delete(room);
    }

    @Transactional(readOnly = true)
    public boolean isMember(UUID roomId, UUID userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Room findByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
    }

    private void requireMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not a member of this room");
        }
    }

    private void requireOwner(UUID roomId, UUID userId) {
        MemberRole role = roomMemberRepository.findRoleByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (!role.isOwner()) {
            throw ApiException.forbidden("FORBIDDEN", "Only the room owner can perform this action");
        }
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHABET.charAt(secureRandom.nextInt(ALPHABET.length())));
            }
            code = sb.toString();
        } while (roomRepository.existsByRoomCode(code));
        return code;
    }

    public static Map<String, Object> roomDto(Room room) {
        return Map.of(
                "id", room.getId().toString(),
                "roomCode", room.getRoomCode(),
                "ownerId", room.getOwner().getId().toString(),
                "visibility", room.isPublic() ? "public" : "private",
                "createdAt", room.getCreatedAt().toString()
        );
    }
}
