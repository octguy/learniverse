package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EditMessageRequest {
    
    @NotNull(message = "Message ID is required")
    private UUID messageId;

    @NotNull(message = "Text content is required")
    private String textContent;
}
