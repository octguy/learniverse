package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class CreateGroupChatRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "At least 2 participants are required")
    private Set<UUID> participantIds;
}
