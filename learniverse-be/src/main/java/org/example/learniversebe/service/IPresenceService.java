package org.example.learniversebe.service;

import org.example.learniversebe.dto.websocket.TypingIndicatorDTO;
import org.example.learniversebe.dto.websocket.UserStatusDTO;

import java.util.UUID;

public interface IPresenceService {
    
    void setUserTyping(UUID chatRoomId, UUID userId, String username, boolean isTyping);
    
    void setUserOnline(UUID userId, String username);
    
    void setUserOffline(UUID userId);
    
    UserStatusDTO getUserStatus(UUID userId);
}
