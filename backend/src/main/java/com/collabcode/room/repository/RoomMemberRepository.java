package com.collabcode.room.repository;

import com.collabcode.room.domain.RoomMember;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends MongoRepository<RoomMember, UUID> {
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);
    List<RoomMember> findAllByRoomId(UUID roomId);
    List<RoomMember> findAllByUserId(UUID userId);
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
    void deleteAllByRoomId(UUID roomId);
}
