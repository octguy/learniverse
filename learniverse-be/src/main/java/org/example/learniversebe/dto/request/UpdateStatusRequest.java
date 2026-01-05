package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.ContentStatus;

@Data
public class UpdateStatusRequest {
    @NotNull(message = "Status is required")
    private ContentStatus status;
}