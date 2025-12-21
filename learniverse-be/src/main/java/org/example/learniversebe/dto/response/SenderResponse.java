package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Information about a message sender")
public class SenderResponse {

    @Schema(description = "Unique identifier of the sender", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID senderId;

    @Schema(description = "Display name of the sender", example = "John Doe")
    private String senderName;

    @Schema(description = "Avatar URL of the sender", example = "https://storage.example.com/avatars/john.png")
    private String senderAvatar;
}
