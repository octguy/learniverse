package org.example.learniversebe.dto.websocket;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReadReceiptDTO {

    private UUID userId;

    private String avatarUrl;

    private LocalDateTime readAt;
}
