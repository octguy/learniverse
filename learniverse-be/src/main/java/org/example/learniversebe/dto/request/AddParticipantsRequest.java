package org.example.learniversebe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class AddParticipantsRequest {

    @NotNull
    private Set<UUID> participants;
}
