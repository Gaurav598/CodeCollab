package com.collabcode.chat.controller;

import com.collabcode.auth.security.CollabUserDetails;
import com.collabcode.chat.dto.NotificationDto;
import com.collabcode.chat.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
public class NotificationRestController {

    private final NotificationService notificationService;

    public NotificationRestController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(@AuthenticationPrincipal CollabUserDetails userDetails, Pageable pageable) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userDetails.getId(), pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal CollabUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId, @AuthenticationPrincipal CollabUserDetails userDetails) {
        notificationService.markAsRead(notificationId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
