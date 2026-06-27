package com.collabcode.chat.repository;

import com.collabcode.chat.domain.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.UUID;

public interface MessageRepository extends MongoRepository<Message, UUID> {
    
    Page<Message> findByRoomIdOrderByCreatedAtDesc(UUID roomId, Pageable pageable);
    void deleteAllByRoomId(UUID roomId);
}
