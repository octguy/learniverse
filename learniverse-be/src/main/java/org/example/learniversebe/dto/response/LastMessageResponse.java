package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

import java.util.UUID;

@Data
@Builder
public class LastMessageResponse {

    private UUID senderId;

    private String senderName;

    private String messageType;

    private String content;

    private LocalDateTime sendAt;
}
