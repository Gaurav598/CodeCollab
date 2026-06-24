package com.collabcode.auth.security;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Loads UserDetails by UUID string (JWT subject).
 * Used by the JWT filter chain to populate SecurityContext.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        return new CollabUserDetails(
                user.getId(),
                user.getId().toString(),
                user.getPasswordHash() != null ? user.getPasswordHash() : ""
        );
    }
}
