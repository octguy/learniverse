package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateGroupChatRequest;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IChatRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequestMapping("/api/v1/chats")
@RestController
@Tag(name = "Chat", description = "Endpoints for chat functionalities")
public class ChatRoomController {

    private final IChatRoomService chatRoomService;

    public ChatRoomController(IChatRoomService chatRoomService) {
        this.chatRoomService = chatRoomService;
    }

    @PostMapping("/direct/{recipientId}")
    public ResponseEntity<?> createDirectChatRoom(@PathVariable UUID recipientId) {
        ChatRoomResponse chatRoomResponse = chatRoomService.createDirectChat(recipientId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "Direct chat created successfully",
                chatRoomResponse,
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroupChatRoom(@Valid @RequestBody CreateGroupChatRequest request) {
        ChatRoomResponse chatRoomResponse = chatRoomService.createGroupChat(request);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.CREATED,
                "Group chat created successfully",
                chatRoomResponse,
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping
    public ResponseEntity<?> getAllChatRoomsByUser() {

        List<ChatRoomResponse> chatRoomResponses = chatRoomService.getAllChatRooms();

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Chat rooms fetched successfully",
                chatRoomResponses,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/direct")
    public ResponseEntity<?> getAllDirectChatRoomsByUser() {
        List<ChatRoomResponse> chatRoomResponses = chatRoomService.getAllDirectChatRooms();

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Direct chat rooms fetched successfully",
                chatRoomResponses,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/group")
    public ResponseEntity<?> getAllGroupChatRoomsByUser() {
        List<ChatRoomResponse> chatRoomResponses = chatRoomService.getAllGroupChatRooms();

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Group chat rooms fetched successfully",
                chatRoomResponses,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("{id}")
    public ResponseEntity<?> getChatRoomById(@PathVariable UUID id) {
        ChatRoomResponse chatRoomResponse = chatRoomService.getChatRoomById(id);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Chat room fetched successfully",
                chatRoomResponse,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

//    @GetMapping("/rooms/{roomId}/messages")
//    public ResponseEntity<?> getChatHistory(
//            @PathVariable UUID roomId,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "50") int size) {
//
//        org.example.learniversebe.dto.response.MessagePageResponse messagePageResponse =
//            chatRoomService.getChatHistory(roomId, page, size);
//
//        ApiResponse<?> apiResponse = new ApiResponse<>(
//                HttpStatus.OK,
//                "Chat history fetched successfully",
//                messagePageResponse,
//                null
//        );
//
//        return ResponseEntity.ok(apiResponse);
//    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveChatRoom(@PathVariable UUID id) {
        chatRoomService.leaveChatRoom(id);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Left chat room successfully",
                null,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<?> deleteChatRoom(@PathVariable UUID id) {
        chatRoomService.deleteChatRoom(id);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Chat room deleted successfully",
                null,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }
}
