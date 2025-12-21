package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Request payload for creating a group chat")
public class CreateGroupChatRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Name of the group chat", example = "Study Group - CS101")
    private String name;

    @NotNull(message = "At least 2 participants are required")
    @Schema(description = "Set of participant user IDs (excluding creator)", example = "[\"550e8400-e29b-41d4-a716-446655440000\", \"660e8400-e29b-41d4-a716-446655440001\"]")
    private Set<UUID> participantIds;
}
