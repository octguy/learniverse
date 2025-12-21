package org.example.learniversebe.dto.websocket;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Real-time typing indicator information")
public class TypingIndicatorDTO {
    
    @Schema(description = "ID of the chat room where typing is occurring", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID chatRoomId;
    
    @Schema(description = "ID of the user who is typing", example = "660e8400-e29b-41d4-a716-446655440001")
    private UUID userId;
    
    @Schema(description = "Username of the user who is typing", example = "johndoe")
    private String username;
    
    @Schema(description = "Whether the user is currently typing", example = "true")
    private boolean isTyping;
}
