package org.example.learniversebe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.learniversebe.enums.MessageType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    
    private UUID id;

    private UUID chatRoomId;

    private SenderResponse sender;

    private MessageType messageType;

    private String textContent;

    private String metadata; // URL for file/image/video

    private UUID parentMessageId;

    private LocalDateTime sendAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private boolean isEdited;
}
