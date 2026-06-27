package com.collabcode.room.service;

import com.collabcode.auth.rbac.RoomMembershipPort;
import com.collabcode.auth.rbac.RoomRole;
import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.domain.Room;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class RoomAccessService implements RoomMembershipPort {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    public RoomAccessService(RoomRepository roomRepository,
                             RoomMemberRepository roomMemberRepository) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
    }

    public void requireMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not a member of this room");
        }
    }

    public void requireEditor(UUID roomId, UUID userId) {
        MemberRole role = roleFor(roomId, userId);
        if (!role.canEdit()) {
            throw ApiException.forbidden("FORBIDDEN", "Editor or Owner role required");
        }
    }

    public void requireOwner(UUID roomId, UUID userId) {
        MemberRole role = roleFor(roomId, userId);
        if (!role.isOwner()) {
            throw ApiException.forbidden("FORBIDDEN", "Owner role required");
        }
    }

    public MemberRole roleFor(UUID roomId, UUID userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(member -> member.getRole())
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
    }

    @Override
    public RoomRole getRoleForUser(String roomCode, String userId) {
        if (roomCode == null || roomCode.isBlank()) {
            return null;
        }
        UUID parsedUserId;
        try {
            parsedUserId = UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            return null;
        }

        return roomRepository.findByRoomCode(roomCode)
                .flatMap(room -> roomMemberRepository.findByRoomIdAndUserId(room.getId(), parsedUserId))
                .map(member -> RoomRole.valueOf(member.getRole().name()))
                .orElse(null);
    }

    public Room requireRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> ApiException.notFound("ROOM_NOT_FOUND", "Room not found"));
    }
}
