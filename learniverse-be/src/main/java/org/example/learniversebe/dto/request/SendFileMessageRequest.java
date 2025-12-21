package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.MessageType;

import java.util.UUID;

@Data
public class SendFileMessageRequest {

    @NotNull(message = "Message type is required")
    private MessageType messageType; // IMAGE, VIDEO, or FILE

    private String textContent; // Optional caption for the file

    private UUID parentMessageId; // Optional, for replies
}
