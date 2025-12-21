package org.example.learniversebe.dto.websocket;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Read receipt information for messages")
public class ReadReceiptDTO {

    @Schema(description = "ID of the user who read the message", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID userId;

    @Schema(description = "Avatar URL of the user", example = "https://storage.example.com/avatars/user.png")
    private String avatarUrl;

    @Schema(description = "Timestamp when the message was read", example = "2025-12-21T10:30:00")
    private LocalDateTime readAt;
}
