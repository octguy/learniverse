package org.example.learniversebe.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusDTO {
    
    private UUID userId;
    private String username;
    private boolean online;
    private LocalDateTime lastSeen;
}
