package com.collabcode.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Origin validation for endpoints that create, rotate, or revoke the HttpOnly
 * refresh cookie. General API authorization remains a Bearer token and is not
 * cookie-authenticated.
 */
public class CookieCsrfFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_PATHS = Set.of(
            "/auth/login", "/auth/register", "/auth/refresh", "/auth/logout");
    private final Set<String> trustedOrigins;

    public CookieCsrfFilter(String allowedOrigins, String frontendUrl) {
        this.trustedOrigins = Arrays.stream((allowedOrigins + "," + frontendUrl).split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(CookieCsrfFilter::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = stripContextPath(request);
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !PROTECTED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            // Non-browser clients and same-origin form submissions may omit Origin.
            // Cross-origin browser fetches include it and are validated below.
            filterChain.doFilter(request, response);
            return;
        }
        if (!trustedOrigins.contains(normalizeOrigin(origin))) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Untrusted request origin");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String stripContextPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String context = request.getContextPath();
        return context != null && !context.isBlank() && uri.startsWith(context)
                ? uri.substring(context.length())
                : uri;
    }

    private static String normalizeOrigin(String raw) {
        try {
            URI uri = URI.create(raw);
            int port = uri.getPort();
            return uri.getScheme().toLowerCase() + "://" + uri.getHost().toLowerCase()
                    + (port == -1 ? "" : ":" + port);
        } catch (RuntimeException ex) {
            return raw.replaceAll("/+$", "").toLowerCase();
        }
    }
}
