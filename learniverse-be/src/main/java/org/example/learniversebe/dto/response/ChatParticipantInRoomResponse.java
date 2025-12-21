package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Information about a participant in a chat room")
public class ChatParticipantInRoomResponse {

    @Schema(description = "Unique identifier of the participant", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID participantId;

    @Schema(description = "Display name of the participant", example = "Jane Smith")
    private String displayName;

    @Schema(description = "Avatar URL of the participant", example = "https://storage.example.com/avatars/jane.png")
    private String avatarUrl;

    @Schema(description = "Role of the participant in the chat", example = "MEMBER", allowableValues = {"ADMIN", "MEMBER"})
    private String role;

    @Schema(description = "Timestamp when the participant joined", example = "2025-12-21T10:30:00")
    private LocalDateTime joinedAt;
}
