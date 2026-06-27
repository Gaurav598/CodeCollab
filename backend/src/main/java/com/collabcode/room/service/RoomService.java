package com.collabcode.room.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.*;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.repository.RoomRepository;
import com.collabcode.room.repository.ProjectRepository;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.chat.repository.MessageRepository;
import org.springframework.stereotype.Service;


import java.security.SecureRandom;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomService {

    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final int CODE_LENGTH = 8;

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final FileRepository fileRepository;
    private final MessageRepository messageRepository;
    private final RoomAccessService roomAccessService;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomService(RoomRepository roomRepository,
                       RoomMemberRepository roomMemberRepository,
                       UserRepository userRepository,
                       ProjectRepository projectRepository,
                       FileRepository fileRepository,
                       MessageRepository messageRepository,
                       RoomAccessService roomAccessService) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.fileRepository = fileRepository;
        this.messageRepository = messageRepository;
        this.roomAccessService = roomAccessService;
    }

    
    @Transactional
    public Map<String, Object> createRoom(UUID ownerId, String visibilityStr) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        String code = generateUniqueCode();
        RoomVisibility visibility = RoomVisibility.fromString(visibilityStr);
        Room room = roomRepository.save(Room.create(ownerId, code, visibility));
        // Add the creator as owner
        roomMemberRepository.save(RoomMember.create(room.getId(), ownerId, MemberRole.owner));
        return roomDto(room, owner);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRoom(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        if (!room.isPublic()) {
            roomAccessService.requireMember(room.getId(), requestingUserId);
        }
        User owner = userRepository.findById(room.getOwnerId()).orElse(null);
        return roomDto(room, owner);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserRooms(UUID userId) {
        List<RoomMember> memberships = roomMemberRepository.findAllByUserId(userId);
        if (memberships.isEmpty()) return List.of();

        // Batch-fetch rooms
        List<UUID> roomIds = memberships.stream().map(RoomMember::getRoomId).toList();
        Map<UUID, Room> roomMap = new java.util.HashMap<>();
        roomRepository.findAllById(roomIds).forEach(r -> roomMap.put(r.getId(), r));

        // Batch-fetch owners
        List<UUID> ownerIds = roomMap.values().stream().map(Room::getOwnerId).distinct().toList();
        Map<UUID, User> userMap = new java.util.HashMap<>();
        userRepository.findAllById(ownerIds).forEach(u -> userMap.put(u.getId(), u));

        return memberships.stream()
                .map(member -> {
                    Room room = roomMap.get(member.getRoomId());
                    if (room == null) return null;
                    User owner = userMap.get(room.getOwnerId());
                    if (owner == null) return null;
                    Map<String, Object> dto = new HashMap<>(roomDto(room, owner));
                    dto.put("role", member.getRole().name());
                    return dto;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRoomMembers(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        roomAccessService.requireMember(room.getId(), requestingUserId);
        List<RoomMember> members = roomMemberRepository.findAllByRoomId(room.getId());
        Map<UUID, User> usersById = new HashMap<>();
        userRepository.findAllById(members.stream().map(RoomMember::getUserId).toList())
                .forEach(user -> usersById.put(user.getId(), user));
        return members.stream()
                .map(member -> {
                    User u = usersById.get(member.getUserId());
                    if (u == null) return null;
                    return Map.<String, Object>of(
                        "userId", u.getId().toString(),
                        "username", u.getUsername(),
                        "role", member.getRole().name()
                    );
                })
                .filter(Objects::nonNull)
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
        roomMemberRepository.save(RoomMember.create(room.getId(), userId, MemberRole.viewer));
        return Map.of("message", "Joined room", "roomCode", roomCode, "role", "viewer");
    }

    
    @Transactional
    public void leaveRoom(String roomCode, UUID userId) {
        Room room = findByCode(roomCode);
        roomAccessService.requireMember(room.getId(), userId);
        if (room.getOwnerId().equals(userId)) {
            throw ApiException.badRequest("OWNER_CANNOT_LEAVE", "Owner cannot leave a room; delete or transfer ownership first.");
        }
        roomMemberRepository.deleteByRoomIdAndUserId(room.getId(), userId);
    }

    
    @Transactional
    public Map<String, Object> patchMember(String roomCode, UUID targetUserId, String roleStr, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        roomAccessService.requireOwner(room.getId(), requestingUserId);
        if (room.getOwnerId().equals(targetUserId)) {
            throw ApiException.badRequest("OWNER_ROLE_LOCKED", "Room owner role cannot be changed");
        }
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(room.getId(), targetUserId)
                .orElseThrow(() -> ApiException.notFound("MEMBER_NOT_FOUND", "User is not a member of this room"));
        MemberRole newRole = MemberRole.valueOf(roleStr);
        if (newRole.isOwner()) {
            throw ApiException.badRequest("OWNER_TRANSFER_UNSUPPORTED", "Ownership transfer is not supported by this endpoint");
        }
        member.setRole(newRole);
        roomMemberRepository.save(member);
        return Map.of("userId", targetUserId, "role", newRole.name());
    }

    
    @Transactional
    public void removeMember(String roomCode, UUID targetUserId, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        roomAccessService.requireOwner(room.getId(), requestingUserId);
        if (room.getOwnerId().equals(targetUserId)) {
            throw ApiException.badRequest("OWNER_CANNOT_BE_REMOVED", "Room owner cannot be removed");
        }
        roomMemberRepository.deleteByRoomIdAndUserId(room.getId(), targetUserId);
    }

    
    @Transactional
    public void deleteRoom(String roomCode, UUID requestingUserId) {
        Room room = findByCode(roomCode);
        roomAccessService.requireOwner(room.getId(), requestingUserId);
        
        roomMemberRepository.deleteAllByRoomId(room.getId());
        messageRepository.deleteAllByRoomId(room.getId());
        
        List<Project> projects = projectRepository.findAllByRoomId(room.getId());
        for (Project p : projects) {
            fileRepository.deleteAllByProjectId(p.getId());
        }
        projectRepository.deleteAllByRoomId(room.getId());
        
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

    private String generateUniqueCode() {
        for (int attempts = 0; attempts < 10; attempts++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHABET.charAt(secureRandom.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        throw ApiException.conflict("ROOM_CODE_COLLISION", "Could not allocate a room code");
    }

    public static Map<String, Object> roomDto(Room room, User owner) {
        return Map.of(
                "id", room.getId().toString(),
                "roomCode", room.getRoomCode(),
                "ownerId", room.getOwnerId().toString(),
                "ownerUsername", owner != null ? owner.getUsername() : "",
                "visibility", room.isPublic() ? "public" : "private",
                "createdAt", room.getCreatedAt().toString()
        );
    }
}
