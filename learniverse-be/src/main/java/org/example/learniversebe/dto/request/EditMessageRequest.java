package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Request payload for editing an existing message")
public class EditMessageRequest {
    
    @NotNull(message = "Message ID is required")
    @Schema(description = "ID of the message to edit", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID messageId;

    @NotNull(message = "Text content is required")
    @Schema(description = "New text content for the message", example = "Updated message content")
    private String textContent;
}
