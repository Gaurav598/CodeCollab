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

        if (!request.getRequestURI().startsWith(request.getContextPath() + "/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing service token");
            return;
        }

        String token = header.substring(7);
        if (properties.getServiceJwtSecret().equals(token)) {
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
