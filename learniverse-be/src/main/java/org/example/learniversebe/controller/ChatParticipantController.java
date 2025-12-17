package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IChatParticipantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequestMapping("/api/v1/chat-participants")
@RestController
@Tag(name = "Chat Participant", description = "Endpoints for chat participant functionalities")
public class ChatParticipantController {

    private final IChatParticipantService chatParticipantService;

    public ChatParticipantController(IChatParticipantService chatParticipantService) {
        this.chatParticipantService = chatParticipantService;
    }

    @PostMapping("/{roomId}/add")
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
}
