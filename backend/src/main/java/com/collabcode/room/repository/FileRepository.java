package com.collabcode.room.repository;

import com.collabcode.room.domain.FileEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface FileRepository extends MongoRepository<FileEntry, UUID> {
    List<FileEntry> findAllByRoomId(UUID roomId);
    List<FileEntry> findAllByRoomIdIn(Collection<UUID> roomIds);
    boolean existsByRoomIdAndPath(UUID roomId, String path);
    boolean existsByRoomIdAndPathAndIdNot(UUID roomId, String path, UUID id);
    void deleteAllByRoomId(UUID roomId);
}
