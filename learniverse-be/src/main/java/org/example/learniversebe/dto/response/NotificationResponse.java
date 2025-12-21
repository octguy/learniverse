package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;
import org.example.learniversebe.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String content;
    private NotificationType notificationType;
    private boolean isRead;
    private UUID relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;

    private UUID senderId;
    private String senderName;
    private String senderAvatarUrl;
}