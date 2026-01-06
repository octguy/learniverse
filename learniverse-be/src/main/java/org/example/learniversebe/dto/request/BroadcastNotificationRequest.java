package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.NotificationType;

import java.util.UUID;
@Data
public class BroadcastNotificationRequest {
    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Notification type is required")
    private NotificationType notificationType;

    private UUID relatedEntityId;

    private String relatedEntityType;
}
