package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ShareType;

import java.util.UUID;

@Data
public class SharePostRequest {
    @NotNull(message = "Original content ID cannot be null")
    private UUID originalContentId;

    @Size(max = 500, message = "Caption cannot exceed 500 characters")
    private String caption;

    @NotNull(message = "Share type is required")
    private ShareType shareType;
}