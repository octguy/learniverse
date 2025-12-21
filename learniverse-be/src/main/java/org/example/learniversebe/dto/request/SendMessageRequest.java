package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Request payload for sending a text message")
public class SendMessageRequest {

    @NotBlank(message = "Text content is required")
    @Schema(description = "The text content of the message", example = "Hello, how are you?")
    private String textContent;

    @Schema(description = "ID of the message being replied to (optional for threaded replies)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID parentMessageId;
}
