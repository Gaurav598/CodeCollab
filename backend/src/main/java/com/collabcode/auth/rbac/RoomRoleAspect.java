package com.collabcode.auth.rbac;

import com.collabcode.common.exception.ApiException;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

/**
 * AOP aspect enforcing @RequireRoomRole.
 * Resolves the roomCode from the request path variable `roomCode`
 * and delegates membership lookup to RoomMembershipPort.
 *
 * Role hierarchy: owner > editor > viewer
 */
@Aspect
@Component
public class RoomRoleAspect {

    private static final Map<RoomRole, Integer> ROLE_RANK = Map.of(
            RoomRole.viewer, 1,
            RoomRole.editor, 2,
            RoomRole.owner,  3
    );

    private final Optional<RoomMembershipPort> membershipPort;

    public RoomRoleAspect(Optional<RoomMembershipPort> membershipPort) {
        this.membershipPort = membershipPort;
    }

    @Before("@annotation(requireRoomRole)")
    public void checkRole(JoinPoint jp, RequireRoomRole requireRoomRole) {
        if (membershipPort.isEmpty()) {
            // Room management not yet implemented (Phase 3) — skip check
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw ApiException.unauthorized("UNAUTHENTICATED", "Not authenticated");
        }

        String userId = auth.getName();
        String roomCode = extractRoomCode();

        RoomRole userRole = membershipPort.get().getRoleForUser(roomCode, userId);
        if (userRole == null) {
            throw ApiException.forbidden("NOT_A_MEMBER", "You are not a member of this room");
        }

        RoomRole required = requireRoomRole.value();
        if (ROLE_RANK.get(userRole) < ROLE_RANK.get(required)) {
            throw ApiException.forbidden("INSUFFICIENT_ROLE",
                    "Requires " + required.name() + " role; you are " + userRole.name());
        }
    }

    private String extractRoomCode() {
        HttpServletRequest request =
                ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        // Room code is always in the path as {roomCode}
        String path = request.getRequestURI();
        String[] segments = path.split("/");
        // /api/v1/rooms/{roomCode}/... → segment index 4
        for (int i = 0; i < segments.length - 1; i++) {
            if ("rooms".equals(segments[i])) return segments[i + 1];
        }
        return "";
    }
}
