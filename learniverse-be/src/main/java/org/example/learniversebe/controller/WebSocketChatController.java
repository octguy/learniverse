package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessageResponse;
import org.example.learniversebe.dto.websocket.TypingIndicatorDTO;
import org.example.learniversebe.service.IChatMessageService;
import org.example.learniversebe.service.IPresenceService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@Slf4j
@Tag(name = "WebSocket Chat", description = "WebSocket endpoints for real-time chat")
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final IChatMessageService chatMessageService;
    private final IPresenceService presenceService;

    public WebSocketChatController(SimpMessagingTemplate messagingTemplate,
                                   IChatMessageService chatMessageService,
                                   IPresenceService presenceService) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageService = chatMessageService;
        this.presenceService = presenceService;
    }

//    @MessageMapping("/chat.send")
//    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
//        try {
//            log.info("Received message from user: {}", principal.getName());
//
//            MessageResponse messageResponse = chatMessageService.sendMessage(request);
//
//            // Broadcast message to all participants in the chat room
//            messagingTemplate.convertAndSend(
//                    "/topic/chat/" + request.getChatRoomId(),
//                    messageResponse
//            );
//
//            log.info("Message sent to chat room: {}", request.getChatRoomId());
//        } catch (Exception e) {
//            log.error("Error sending message", e);
//            // Send error back to sender
//            messagingTemplate.convertAndSendToUser(
//                    principal.getName(),
//                    "/queue/errors",
//                    "Failed to send message: " + e.getMessage()
//            );
//        }
//    }

//    @MessageMapping("/chat.typing")
//    public void handleTypingIndicator(@Payload TypingIndicatorDTO typingIndicator, Principal principal) {
//        try {
//            log.debug("Typing indicator from user: {} in room: {}",
//                    principal.getName(), typingIndicator.getChatRoomId());
//
//            presenceService.setUserTyping(
//                    typingIndicator.getChatRoomId(),
//                    typingIndicator.getUserId(),
//                    typingIndicator.getUsername(),
//                    typingIndicator.isTyping()
//            );
//
//            // Broadcast typing indicator to other participants
//            messagingTemplate.convertAndSend(
//                    "/topic/chat/" + typingIndicator.getChatRoomId() + "/typing",
//                    typingIndicator
//            );
//        } catch (Exception e) {
//            log.error("Error handling typing indicator", e);
//        }
//    }

//    @MessageMapping("/chat.receipt")
//    public void handleMessageReceipt(@Payload Map<String, Object> payload, Principal principal) {
//        try {
//            UUID messageId = UUID.fromString(payload.get("messageId").toString());
//            UUID userId = UUID.fromString(payload.get("userId").toString());
//            String action = payload.getOrDefault("action", "read").toString();
//
//            log.debug("Message receipt from user: {} for message: {} - action: {}",
//                    principal.getName(), messageId, action);
//
//            // Mark message as read
//            MessageReceiptDTO receipt =
//                    messageReceiptService.markAsRead(messageId, userId);
//
//            // Broadcast receipt to the chat room
//            messagingTemplate.convertAndSend(
//                    "/topic/receipts/" + messageId,
//                    receipt
//            );
//        } catch (Exception e) {
//            log.error("Error handling message receipt", e);
//        }
//    }
}
