package com.collabcode.internal.security;

import com.collabcode.config.SecurityProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;

public class ServiceJwtFilter extends OncePerRequestFilter {

    private final SecurityProperties properties;

    public ServiceJwtFilter(SecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.contains("/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing service token");
            return;
        }

        String token = header.substring(7);
        String configuredSecret = properties.getServiceJwtSecret();
        System.out.println("DEBUG: token=" + token + ", expected=" + configuredSecret);
        byte[] expected = configuredSecret != null ? configuredSecret.getBytes(StandardCharsets.UTF_8) : new byte[0];
        byte[] provided = token.getBytes(StandardCharsets.UTF_8);
        if (MessageDigest.isEqual(expected, provided)) {
            // Valid service token. Grant full access but not tied to a specific user.
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sync-service", null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
        } else {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid service token");
        }
    }
}
