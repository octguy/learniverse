package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Text content is required")
    private String textContent;

    private UUID parentMessageId;
}
