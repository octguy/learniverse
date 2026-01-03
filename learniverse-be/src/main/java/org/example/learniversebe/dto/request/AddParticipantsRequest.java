package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Request payload for adding participants to a chat room")
public class AddParticipantsRequest {

    @NotNull
    @Schema(description = "Set of user IDs to add as participants", example = "[\"550e8400-e29b-41d4-a716-446655440000\", \"660e8400-e29b-41d4-a716-446655440001\"]")
    private Set<UUID> participants;
}
