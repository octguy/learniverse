package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Response containing message details")
public class MessageResponse {
    
    @Schema(description = "Unique identifier of the message", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "ID of the chat room this message belongs to", example = "660e8400-e29b-41d4-a716-446655440001")
    private UUID chatRoomId;

    @Schema(description = "Information about the message sender")
    private SenderResponse sender;

    @Schema(description = "Type of message", example = "TEXT", allowableValues = {"TEXT", "IMAGE", "VIDEO", "FILE"})
    private String messageType;

    @Schema(description = "The text content of the message", example = "Hello everyone!")
    private String textContent;

    @Schema(description = "URL or metadata for file attachments (images, videos, files)", example = "https://storage.example.com/files/image123.png")
    private String metadata; // URL for file/image/video

    @Schema(description = "ID of the parent message if this is a reply", example = "770e8400-e29b-41d4-a716-446655440002")
    private UUID parentMessageId;

    @Schema(description = "Timestamp when the message was created", example = "2025-12-21T10:30:00")
    private LocalDateTime createdAt;
}
