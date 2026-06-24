package com.collabcode.room.repository;

import com.collabcode.room.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
}
