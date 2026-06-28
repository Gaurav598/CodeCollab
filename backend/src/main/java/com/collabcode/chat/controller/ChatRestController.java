package com.collabcode.chat.controller;

import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.service.ChatService;
import com.collabcode.auth.security.CollabUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    private final ChatService chatService;

    public ChatRestController(ChatService chatService) {
        this.chatService = chatService;
    }

    /** GET /chat/{roomId}/history — returns in-memory ephemeral messages only */
    @GetMapping("/{roomId}/history")
    public ResponseEntity<List<ChatMessageDto>> getHistory(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal CollabUserDetails user) {
        return ResponseEntity.ok(chatService.getMessageHistory(roomId, user.getId()));
    }
}

