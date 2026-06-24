package com.collabcode.room.repository;

import com.collabcode.room.domain.MemberRole;
import com.collabcode.room.domain.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);
    List<RoomMember> findAllByRoomId(UUID roomId);
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    @Query("SELECT m.role FROM RoomMember m WHERE m.room.id = :roomId AND m.user.id = :userId")
    Optional<MemberRole> findRoleByRoomIdAndUserId(UUID roomId, UUID userId);

    @Modifying
    @Query("DELETE FROM RoomMember m WHERE m.room.id = :roomId AND m.user.id = :userId")
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
}
