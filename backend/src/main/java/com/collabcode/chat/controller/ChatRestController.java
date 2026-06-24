package com.collabcode.chat.controller;

import com.collabcode.chat.dto.ChatMessageDto;
import com.collabcode.chat.service.ChatService;
import com.collabcode.auth.rbac.RequireRoomRole;
import com.collabcode.auth.rbac.RoomRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    private final ChatService chatService;

    public ChatRestController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/{roomId}/history")
    @RequireRoomRole(RoomRole.viewer)
    public ResponseEntity<Page<ChatMessageDto>> getHistory(@PathVariable UUID roomId, Pageable pageable) {
        return ResponseEntity.ok(chatService.getMessageHistory(roomId, pageable));
    }
}
