package com.collabcode.auth.repository;

import com.collabcode.auth.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserRepository extends MongoRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    List<User> findAllByUsernameIn(Collection<String> usernames);
    
    Optional<User> findByEmailIgnoreCaseOrUsernameIgnoreCase(String email, String username);
}
