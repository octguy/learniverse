package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class AddParticipantsResponse {

    private UUID chatRoomId;

    private Set<UUID> participants;
}
