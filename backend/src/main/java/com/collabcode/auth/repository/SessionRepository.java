package com.collabcode.auth.repository;

import com.collabcode.auth.domain.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends MongoRepository<Session, UUID> {
    Optional<Session> findByRefreshToken(String hashedToken);
    void deleteAllByUserId(UUID userId);
    void deleteByExpiresAtBefore(Instant now);
}
