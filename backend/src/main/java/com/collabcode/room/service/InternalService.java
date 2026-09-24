package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.FileEntry;
import com.collabcode.room.repository.FileRepository;
import com.collabcode.room.repository.RoomMemberRepository;
import com.collabcode.room.domain.MemberRole;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class InternalService {

    private final RoomMemberRepository roomMemberRepository;
    private final FileRepository fileRepository;
    private final MongoTemplate mongoTemplate;

    private static final int MAX_YJS_STATE_BYTES = 16 * 1024 * 1024;
    private static final int MAX_TEXT_CONTENT_CHARS = 5 * 1024 * 1024;

    public InternalService(RoomMemberRepository roomMemberRepository,
                           FileRepository fileRepository,
                           MongoTemplate mongoTemplate) {
        this.roomMemberRepository = roomMemberRepository;
        this.fileRepository = fileRepository;
        this.mongoTemplate = mongoTemplate;
    }

    
    @Transactional(readOnly = true)
    public boolean validateMembership(UUID roomId, UUID userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(member -> member.getRole() != MemberRole.pending)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateCollaboration(UUID roomId, UUID fileId, UUID userId) {
        FileEntry file = fileRepository.findById(fileId)
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
        if (!file.getRoomId().equals(roomId)) {
            throw ApiException.forbidden("FILE_ROOM_MISMATCH", "File does not belong to the requested room");
        }
        MemberRole role = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(member -> member.getRole())
                .orElseThrow(() -> ApiException.forbidden("FORBIDDEN", "Not a member of this room"));
        if (role == MemberRole.pending) {
            throw ApiException.forbidden("PENDING_APPROVAL", "Waiting for room owner approval");
        }
        return Map.of(
                "allowed", true,
                "canEdit", role.canEdit(),
                "role", role.name()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCollaborationSnapshot(UUID fileId) {
        FileEntry file = findFile(fileId);
        return Map.of(
                "fileId", file.getId().toString(),
                "roomId", file.getRoomId().toString(),
                "state", file.getYjsState() == null ? "" : file.getYjsState(),
                "version", file.getCollaborationVersion(),
                "content", file.getContent() == null ? "" : file.getContent()
        );
    }

    /**
     * Atomically replaces the complete CRDT snapshot only when the caller based
     * it on the current version. A stale sync node receives a conflict and must
     * merge the current Yjs state before retrying.
     */
    public Map<String, Object> saveCollaborationSnapshot(
            UUID fileId, UUID roomId, long expectedVersion, String state, String content) {
        validateSnapshot(state, content);

        Criteria versionCriteria = expectedVersion == 0L
                ? new Criteria().orOperator(
                        Criteria.where("collaboration_version").exists(false),
                        Criteria.where("collaboration_version").is(0L))
                : Criteria.where("collaboration_version").is(expectedVersion);
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("_id").is(fileId),
                Criteria.where("room_id").is(roomId),
                versionCriteria));
        Update update = new Update()
                .set("yjs_state", state)
                .set("content", content)
                .set("collaboration_version", expectedVersion + 1L)
                .set("collaboration_updated_at", Instant.now());

        FileEntry saved = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                FileEntry.class);
        if (saved != null) {
            return getCollaborationSnapshot(saved.getId());
        }

        FileEntry current = findFile(fileId);
        if (!current.getRoomId().equals(roomId)) {
            throw ApiException.forbidden("FILE_ROOM_MISMATCH", "File does not belong to the requested room");
        }
        throw ApiException.conflict("STALE_DOCUMENT_VERSION", "Document state changed; reload and merge before retrying");
    }

    private void validateSnapshot(String state, String content) {
        if (state == null || state.isBlank()) {
            throw ApiException.badRequest("INVALID_YJS_STATE", "Yjs state is required");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(state);
            if (decoded.length > MAX_YJS_STATE_BYTES) {
                throw ApiException.badRequest("DOCUMENT_TOO_LARGE", "Yjs state exceeds the 16 MiB limit");
            }
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("INVALID_YJS_STATE", "Yjs state must be valid Base64");
        }
        if (content != null && content.length() > MAX_TEXT_CONTENT_CHARS) {
            throw ApiException.badRequest("DOCUMENT_TOO_LARGE", "Text content exceeds the 5 MiB limit");
        }
    }

    private FileEntry findFile(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> ApiException.notFound("FILE_NOT_FOUND", "File not found"));
    }
}
