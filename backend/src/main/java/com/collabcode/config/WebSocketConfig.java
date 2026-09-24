package com.collabcode.config;

import com.collabcode.auth.security.JwtTokenProvider;
import com.collabcode.auth.security.UserDetailsServiceImpl;
import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.room.service.RoomAccessService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final RoomAccessService roomAccessService;
    private final Map<String, CollabUserDetails> sessionUsers = new ConcurrentHashMap<>();
    private static final Pattern ROOM_DESTINATION = Pattern.compile("^/topic/room\\.([0-9a-fA-F-]{36})(?:\\..+)?$");

    public WebSocketConfig(JwtTokenProvider jwtTokenProvider,
                           UserDetailsServiceImpl userDetailsService,
                           RoomAccessService roomAccessService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        this.roomAccessService = roomAccessService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Value("${ALLOWED_ORIGINS:http://localhost:3000,http://127.0.0.1:3000}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    if (authorization != null && !authorization.isEmpty()) {
                        String bearerToken = authorization.get(0);
                        if (bearerToken.startsWith("Bearer ")) {
                            String jwt = bearerToken.substring(7);
                            if (jwtTokenProvider.isValid(jwt)) {
                                java.util.UUID userId = jwtTokenProvider.extractUserId(jwt);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                                if (accessor.getSessionId() != null && userDetails instanceof CollabUserDetails user) {
                                    sessionUsers.put(accessor.getSessionId(), user);
                                }
                            }
                        }
                    }
                    if (accessor.getUser() == null) {
                        throw new org.springframework.messaging.MessagingException("Valid bearer token required");
                    }
                } else if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    if (accessor.getSessionId() != null) sessionUsers.remove(accessor.getSessionId());
                } else if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    CollabUserDetails user = requireUser(accessor);
                    authorizeRoomDestination(accessor.getDestination(), user);
                } else if (accessor != null && StompCommand.SEND.equals(accessor.getCommand())) {
                    requireUser(accessor);
                    String destination = accessor.getDestination();
                    if (destination != null && (destination.startsWith("/topic/") || destination.startsWith("/queue/"))) {
                        throw new org.springframework.messaging.MessagingException("Clients must send through /app destinations");
                    }
                }
                return message;
            }
        });
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getDestination() == null) {
                    return message;
                }
                Matcher matcher = ROOM_DESTINATION.matcher(accessor.getDestination());
                if (!matcher.matches()) return message;
                try {
                    CollabUserDetails user = principal(accessor);
                    if (user == null) return null;
                    roomAccessService.requireMember(UUID.fromString(matcher.group(1)), user.getId());
                    return message;
                } catch (RuntimeException denied) {
                    return null;
                }
            }
        });
    }

    private CollabUserDetails requireUser(StompHeaderAccessor accessor) {
        CollabUserDetails user = principal(accessor);
        if (user == null) {
            throw new org.springframework.messaging.MessagingException("Authenticated STOMP session required");
        }
        return user;
    }

    private CollabUserDetails principal(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof CollabUserDetails user) {
            return user;
        }
        return accessor.getSessionId() == null ? null : sessionUsers.get(accessor.getSessionId());
    }

    private void authorizeRoomDestination(String destination, CollabUserDetails user) {
        if (destination == null) {
            throw new org.springframework.messaging.MessagingException("Subscription destination required");
        }
        Matcher matcher = ROOM_DESTINATION.matcher(destination);
        if (matcher.matches()) {
            roomAccessService.requireMember(UUID.fromString(matcher.group(1)), user.getId());
        } else if (!destination.startsWith("/user/queue/")) {
            throw new org.springframework.messaging.MessagingException("Unsupported subscription destination");
        }
    }
}
