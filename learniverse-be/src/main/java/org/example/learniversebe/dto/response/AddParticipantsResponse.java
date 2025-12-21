package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Response after adding participants to a chat room")
public class AddParticipantsResponse {

    @Schema(description = "ID of the chat room", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID chatRoomId;

    @Schema(description = "Set of all participant IDs in the room after addition", example = "[\"660e8400-e29b-41d4-a716-446655440001\", \"770e8400-e29b-41d4-a716-446655440002\"]")
    private Set<UUID> participants;
}
