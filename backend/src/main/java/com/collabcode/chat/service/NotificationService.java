package com.collabcode.chat.service;

import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.chat.domain.Notification;
import com.collabcode.chat.dto.NotificationDto;
import com.collabcode.chat.repository.NotificationRepository;
import com.collabcode.common.exception.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    
    @Transactional
    public void createNotification(UUID userId, String type, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(message);

        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = NotificationDto.fromEntity(saved);
        
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/queue/notifications", 
            dto
        );
    }

    
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDto::fromEntity);
    }

    
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("NOTIFICATION_NOT_FOUND", "Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not your notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
