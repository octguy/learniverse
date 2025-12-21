package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.EditMessageRequest;
import org.example.learniversebe.dto.request.SendFileMessageRequest;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessageResponse;
import org.example.learniversebe.dto.response.pagination.PageResponse;
import org.example.learniversebe.dto.websocket.UserStatusDTO;
import org.example.learniversebe.enums.MessageType;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.model.User;
import org.example.learniversebe.service.IChatMessageService;
import org.example.learniversebe.service.IPresenceService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@RequestMapping("/api/v1/messages")
@RestController
@Tag(name = "Chat Message", description = "Endpoints for chat message functionalities")
public class ChatMessageController {

    private final IChatMessageService chatMessageService;
    private final IPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageController(IChatMessageService chatMessageService,
                                 IPresenceService presenceService,
                                 SimpMessagingTemplate messagingTemplate) {
        this.chatMessageService = chatMessageService;
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/send/{roomId}")
    public ResponseEntity<?> sendTextMessage(@PathVariable UUID roomId,
                                             @Valid @RequestBody SendMessageRequest request) {
        MessageResponse messageResponse = chatMessageService.sendMessage(roomId, request);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "Message sent successfully",
                messageResponse,
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping(value = "/send-with-file/{roomId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> sendMessageWithFile(
            @PathVariable UUID roomId,
            @RequestParam("messageType") MessageType messageType,
            @RequestParam(value = "textContent", required = false) String textContent,
            @RequestParam(value = "parentMessageId", required = false) UUID parentMessageId,
            @RequestParam("file") MultipartFile file) {

        SendFileMessageRequest request = new SendFileMessageRequest();
        request.setMessageType(messageType);
        request.setTextContent(textContent);
        request.setParentMessageId(parentMessageId);

        MessageResponse messageResponse = chatMessageService.sendMessageWithFile(roomId, request, file);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "Message with file sent successfully",
                messageResponse,
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/mark-as-read/{roomId}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable UUID roomId) {
        chatMessageService.markAsRead(roomId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Messages marked as read successfully",
                null,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PutMapping("/edit")
    public ResponseEntity<?> editMessage(@Valid @RequestBody EditMessageRequest request) {
        MessageResponse messageResponse = chatMessageService.editMessage(request);

        // Broadcast update via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/chat/" + messageResponse.getChatRoomId() + "/updates",
                messageResponse
        );

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Message edited successfully",
                messageResponse,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/room/{chatRoomId}")
    public ResponseEntity<?> getMessagesByChatRoom(
            @PathVariable UUID chatRoomId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursor,
            @RequestParam(defaultValue = "20") int limit) {

        PageResponse<MessageResponse> pageResponse =
                chatMessageService.getAllMessagesInChatRoom(chatRoomId, cursor, limit);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Messages fetched successfully",
                pageResponse,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{messageId}")
    public ResponseEntity<?> getMessageById(@PathVariable UUID messageId) {
        MessageResponse messageResponse = chatMessageService.getMessageById(messageId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Message fetched successfully",
                messageResponse,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/presence/online")
    public ResponseEntity<?> setUserOnline() {
        User currentUser = SecurityUtils.getCurrentUser();
        presenceService.setUserOnline(currentUser.getId(), currentUser.getUsername());

        // Broadcast online status
        UserStatusDTO statusDTO = new UserStatusDTO();
        statusDTO.setUserId(currentUser.getId());
        statusDTO.setUsername(currentUser.getUsername());
        statusDTO.setOnline(true);

        messagingTemplate.convertAndSend("/topic/presence", statusDTO);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User status set to online",
                statusDTO,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/presence/offline")
    public ResponseEntity<?> setUserOffline() {
        User currentUser = SecurityUtils.getCurrentUser();
        presenceService.setUserOffline(currentUser.getId());

        // Broadcast offline status
        UserStatusDTO statusDTO = new UserStatusDTO();
        statusDTO.setUserId(currentUser.getId());
        statusDTO.setUsername(currentUser.getUsername());
        statusDTO.setOnline(false);

        messagingTemplate.convertAndSend("/topic/presence", statusDTO);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User status set to offline",
                null,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/presence/{userId}")
    public ResponseEntity<?> getUserStatus(@PathVariable UUID userId) {
        UserStatusDTO statusDTO = presenceService.getUserStatus(userId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "User status fetched successfully",
                statusDTO,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }
}
