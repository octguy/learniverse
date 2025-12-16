package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IChatRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RequestMapping("/api/v1/chat")
@RestController
@Tag(name = "Chat", description = "Endpoints for chat functionalities")
public class ChatController {

    private final IChatRoomService chatRoomService;

    public ChatController(IChatRoomService chatRoomService) {
        this.chatRoomService = chatRoomService;
    }

    @PostMapping("/create-direct-chat/{id}")
    public ResponseEntity<?> createDirectChatRoom(@PathVariable UUID id) {
        ChatRoomResponse chatRoomResponse = chatRoomService.createDirectChatRoom(id);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Chat room created successfully",
                chatRoomResponse,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

}
