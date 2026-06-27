package com.collabcode.room.repository;

import com.collabcode.room.domain.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends MongoRepository<Project, UUID> {
    List<Project> findAllByRoomId(UUID roomId);
    void deleteAllByRoomId(UUID roomId);
}
