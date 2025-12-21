package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.MessageType;

import java.util.UUID;

@Data
@Schema(description = "Request payload for sending a message with a file attachment")
public class SendFileMessageRequest {

    @NotNull(message = "Message type is required")
    @Schema(description = "Type of the file message", example = "IMAGE", allowableValues = {"IMAGE", "VIDEO", "FILE"})
    private MessageType messageType; // IMAGE, VIDEO, or FILE

    @Schema(description = "Optional text caption for the file", example = "Here's the document you requested")
    private String textContent; // Optional caption for the file

    @Schema(description = "ID of the message being replied to (optional)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID parentMessageId; // Optional, for replies
}
