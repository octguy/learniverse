package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Schema(description = "Data required to send notifications")
public class SendNotificationRequest {

    @Schema(description = "Notification content/message", example = "System maintenance scheduled for tomorrow", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Content cannot be blank")
    @Size(max = 1000, message = "Content cannot exceed 1000 characters")
    private String content;

    @Schema(description = "List of recipient user IDs. If null or empty, notification will be broadcast to all users")
    private List<UUID> recipientIds;

    @Schema(description = "Related entity ID (optional)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID relatedEntityId;

    @Schema(description = "Related entity type (optional)", example = "ANNOUNCEMENT")
    private String relatedEntityType;
}
