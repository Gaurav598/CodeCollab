package com.collabcode.room.repository;

import com.collabcode.room.domain.FileEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface FileRepository extends MongoRepository<FileEntry, UUID> {
    List<FileEntry> findAllByProjectId(UUID projectId);
    List<FileEntry> findAllByProjectIdIn(Collection<UUID> projectIds);
    boolean existsByProjectIdAndPath(UUID projectId, String path);
    boolean existsByProjectIdAndPathAndIdNot(UUID projectId, String path, UUID id);
    void deleteAllByProjectId(UUID projectId);
}
