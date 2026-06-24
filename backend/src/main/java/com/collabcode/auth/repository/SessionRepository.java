package com.collabcode.auth.repository;

import com.collabcode.auth.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByRefreshToken(String hashedToken);

    @Modifying
    @Query("DELETE FROM Session s WHERE s.user.id = :userId")
    void deleteAllByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM Session s WHERE s.expiresAt < :now")
    void deleteExpiredSessions(Instant now);
}
