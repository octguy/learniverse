package org.example.learniversebe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

import java.util.UUID;

@Data
@Builder
public class ChatRoomResponse {

    private UUID id;

    private String name;

    private Set<UUID> members;

    private boolean isGroupChat;

    private LocalDateTime createdAt;
}
