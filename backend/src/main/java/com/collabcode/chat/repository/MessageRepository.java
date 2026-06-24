package com.collabcode.chat.repository;

import com.collabcode.chat.domain.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.room.id = :roomId ORDER BY m.createdAt DESC")
    Page<Message> findByRoomIdOrderByCreatedAtDesc(@Param("roomId") UUID roomId, Pageable pageable);
}
