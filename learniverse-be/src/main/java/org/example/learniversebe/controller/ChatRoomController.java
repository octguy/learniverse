package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "Create a direct chat", description = "Creates a direct (1-on-1) chat room with the specified recipient. Returns existing chat if already exists.")
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
    @Operation(summary = "Create a group chat", description = "Creates a new group chat with multiple participants. Requires at least 2 participants and a group name.")
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
    @Operation(summary = "Get all chat rooms", description = "Retrieves all chat rooms (both direct and group) for the current user.")
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
    @Operation(summary = "Get all direct chats", description = "Retrieves all direct (1-on-1) chat rooms for the current user.")
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
    @Operation(summary = "Get all group chats", description = "Retrieves all group chat rooms for the current user.")
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
    @Operation(summary = "Get chat room by ID (Admin only)", description = "Retrieves detailed information for a specific chat room. Requires ADMIN role.")
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

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave a chat room", description = "Allows the current user to leave a chat room. Removes them as a participant.")
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
    @Operation(summary = "Delete a chat room (Admin only)", description = "Soft-deletes a chat room. Requires ADMIN role.")
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
