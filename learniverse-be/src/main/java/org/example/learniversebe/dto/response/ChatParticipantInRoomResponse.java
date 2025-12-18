package org.example.learniversebe.dto.response;

import java.time.LocalDateTime;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatParticipantInRoomResponse {

    private UUID participantId;

    private String displayName;

    private String avatarUrl;

    private String role;

    private LocalDateTime joinedAt;
}
