package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReceiptDTO {
    private UUID messageId;
    private UUID userId;
    private String username;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private Boolean isRead;
}
