package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Response containing chat room details")
public class ChatRoomResponse {

    @Schema(description = "Unique identifier of the chat room", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Name of the chat room (null for direct chats)", example = "Study Group - CS101")
    private String name;

    @Schema(description = "Set of participant user IDs", example = "[\"660e8400-e29b-41d4-a716-446655440001\", \"770e8400-e29b-41d4-a716-446655440002\"]")
    private Set<UUID> participants;

    @Schema(description = "Indicates if this is a group chat (true) or direct chat (false)", example = "true")
    private boolean isGroupChat;

    @Schema(description = "Timestamp when the chat room was created", example = "2025-12-21T10:30:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "Details of the last message in the chat room")
    private LastMessageResponse lastMessage;
    
    @Schema(description = "Number of unread messages for the current user", example = "5")
    private Integer unreadCount;
}
