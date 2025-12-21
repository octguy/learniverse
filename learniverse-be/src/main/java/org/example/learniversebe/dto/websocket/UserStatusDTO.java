package org.example.learniversebe.dto.websocket;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Real-time user online/offline status information")
public class UserStatusDTO {
    
    @Schema(description = "Unique identifier of the user", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID userId;
    
    @Schema(description = "Username of the user", example = "johndoe")
    private String username;
    
    @Schema(description = "Whether the user is currently online", example = "true")
    private boolean online;
    
    @Schema(description = "Timestamp of when the user was last seen (for offline users)", example = "2025-12-21T10:30:00")
    private LocalDateTime lastSeen;
}
