package org.example.learniversebe.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.websocket.UserStatusDTO;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.UUID;

@Component
@Slf4j
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        
        if (username != null) {
            log.info("User connected: {}", username);
            
            // Extract user ID from session attributes if needed
            // For now, we'll handle online status when user explicitly subscribes
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        
        if (username != null) {
            log.info("User disconnected: {}", username);
            
            // Get user ID from session attributes
            String userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");
            if (userIdStr != null) {
                UUID userId = UUID.fromString(userIdStr);

                // Broadcast user offline status
                UserStatusDTO statusDTO = new UserStatusDTO();
                statusDTO.setUserId(userId);
                statusDTO.setUsername(username);
                statusDTO.setOnline(false);
                
                messagingTemplate.convertAndSend("/topic/presence", statusDTO);
                log.info("User {} status changed to offline", username);
            }
        }
    }
}
