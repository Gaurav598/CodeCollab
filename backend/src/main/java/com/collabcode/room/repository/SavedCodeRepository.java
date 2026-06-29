package com.collabcode.room.repository;

import com.collabcode.room.domain.SavedCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedCodeRepository extends MongoRepository<SavedCode, UUID> {
    List<SavedCode> findAllByUserIdOrderByUpdatedAtDesc(UUID userId);
}
