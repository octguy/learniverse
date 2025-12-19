package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.MessageType;

import java.util.UUID;

@Data
public class SendMessageRequest {
    
    @NotNull(message = "Chat room ID is required")
    private UUID chatRoomId;

    @NotNull(message = "Message type is required")
    private MessageType messageType;

    private String textContent;

    private UUID parentMessageId; // For reply functionality

    // For file/image/video - will be uploaded separately and URL stored in metadata
}
