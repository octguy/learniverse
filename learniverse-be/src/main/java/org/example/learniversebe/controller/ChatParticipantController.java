package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;
import org.example.learniversebe.dto.response.ChatParticipantInRoomResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IChatParticipantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequestMapping("/api/v1/chats")
@RestController
@Tag(name = "Chat Participant", description = "Endpoints for chat participant functionalities")
public class ChatParticipantController {

    private final IChatParticipantService chatParticipantService;

    public ChatParticipantController(IChatParticipantService chatParticipantService) {
        this.chatParticipantService = chatParticipantService;
    }

    @PostMapping("/{roomId}/add")
    @Operation(summary = "Add participants to chat room", description = "Adds one or more participants to an existing chat room. Typically used for group chats.")
    public ResponseEntity<?> addParticipants(@RequestBody @Valid AddParticipantsRequest request,
                                             @PathVariable UUID roomId) {
        AddParticipantsResponse res = chatParticipantService.addParticipant(roomId, request);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Participants added successfully",
                res,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @DeleteMapping("/{roomId}/participants/{userId}")
    @Operation(summary = "Remove a participant", description = "Removes a specific participant from a chat room. Requires appropriate permissions.")
    public ResponseEntity<?> removeParticipant(@PathVariable UUID roomId, @PathVariable UUID userId) {
        chatParticipantService.removeParticipant(roomId, userId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Participant removed successfully",
                null,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{roomId}/participants")
    @Operation(summary = "Get all participants in a chat room", description = "Retrieves a list of all participants in a specific chat room with their details.")
    public ResponseEntity<?> getAllParticipants(@PathVariable UUID roomId) {
        List<ChatParticipantInRoomResponse> participants = chatParticipantService.getParticipantsInRoom(roomId);

        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Participants fetched successfully",
                participants,
                null
        );

        return ResponseEntity.ok(apiResponse);
    }
}
