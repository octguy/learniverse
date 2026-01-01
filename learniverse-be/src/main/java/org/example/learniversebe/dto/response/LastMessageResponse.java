package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Information about the last message in a chat room")
public class LastMessageResponse {

    @Schema(description = "ID of the message sender", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID senderId;

    @Schema(description = "Name of the message sender", example = "John Doe")
    private String senderName;

    @Schema(description = "Type of the message", example = "TEXT", allowableValues = {"TEXT", "IMAGE", "VIDEO", "FILE"})
    private String messageType;

    @Schema(description = "Content of the message", example = "Hello everyone!")
    private String content;

    @Schema(description = "Timestamp when the message was sent", example = "2025-12-21T10:30:00")
    private LocalDateTime sendAt;
}
