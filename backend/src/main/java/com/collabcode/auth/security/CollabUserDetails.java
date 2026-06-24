package com.collabcode.auth.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

/**
 * Custom UserDetails that carries the UUID of the authenticated user,
 * so controllers can call principal.getId() without another DB lookup.
 */
public class CollabUserDetails implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;

    public CollabUserDetails(UUID id, String username, String password) {
        this.id = id;
        this.username = username;
        this.password = password;
    }

    public UUID getId() { return id; }

    @Override public String getUsername() { return username; }
    @Override public String getPassword() { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return Collections.emptyList(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
