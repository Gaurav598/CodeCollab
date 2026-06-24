package com.collabcode.room.repository;

import com.collabcode.room.domain.FileEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileEntry, UUID> {
    List<FileEntry> findAllByProjectId(UUID projectId);
    boolean existsByProjectIdAndPath(UUID projectId, String path);
}
