package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.UUID;

@Service
public class InternalService {

    private final RoomMemberRepository roomMemberRepository;
    private final FileRepository fileRepository;

    public InternalService(RoomMemberRepository roomMemberRepository,
                           FileRepository fileRepository) {
        this.roomMemberRepository = roomMemberRepository;
        this.fileRepository = fileRepository;
    }

    
    @Transactional(readOnly = true)
    public boolean validateMembership(UUID roomId, UUID userId) {
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
