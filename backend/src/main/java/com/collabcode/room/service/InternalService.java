package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.domain.Room;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class InternalService {

    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final FileRepository fileRepository;

    public InternalService(RoomMemberRepository roomMemberRepository,
                           RoomRepository roomRepository,
                           FileRepository fileRepository) {
        this.roomMemberRepository = roomMemberRepository;
        this.roomRepository = roomRepository;
        this.fileRepository = fileRepository;
    }

    @Transactional(readOnly = true)
    public boolean validateMembership(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return false;
        if (room.isPublic()) return true;
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    @Transactional
    public void updateFileContent(UUID fileId, String content) {
        FileEntry file = fileRepository.findById(fileId)
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
        file.setContent(content);
        fileRepository.save(file);
    }
}
