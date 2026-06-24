package com.collabcode.auth.repository;

import com.collabcode.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    /** Lookup by email OR username — used for login identifier resolution */
    Optional<User> findByEmailOrUsername(String email, String username);
}
