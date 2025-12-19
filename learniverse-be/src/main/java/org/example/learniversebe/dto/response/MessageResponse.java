package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    
    private UUID id;

    private UUID chatRoomId;

    private SenderResponse sender;

    private String messageType;

    private String textContent;

    private String metadata; // URL for file/image/video

    private UUID parentMessageId;

    private LocalDateTime createdAt;
}
