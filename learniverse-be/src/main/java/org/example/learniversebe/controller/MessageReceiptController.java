package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.MarkMessageReadRequest;
import org.example.learniversebe.dto.response.MessageReceiptDTO;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.model.User;
import org.example.learniversebe.service.IMessageReceiptService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages/receipts")
@RequiredArgsConstructor
@Tag(name = "Message Receipts", description = "Message receipt and read status management")
public class MessageReceiptController {

    private final IMessageReceiptService messageReceiptService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/read/{messageId}")
    @Operation(summary = "Mark a message as read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID messageId) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        MessageReceiptDTO receipt = messageReceiptService.markAsRead(messageId, currentUser.getId());
        
        // Broadcast read receipt to chat room
        messagingTemplate.convertAndSend(
            "/topic/receipts/" + messageId,
            receipt
        );
        
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Message marked as read",
                receipt,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/read/multiple")
    @Operation(summary = "Mark multiple messages as read")
    public ResponseEntity<?> markMultipleAsRead(@RequestBody MarkMessageReadRequest request) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        List<MessageReceiptDTO> receipts = messageReceiptService.markMultipleAsRead(request.getMessageIds(), currentUser.getId());
        
        // Broadcast each receipt
        receipts.forEach(receipt -> 
            messagingTemplate.convertAndSend("/topic/receipts/" + receipt.getMessageId(), receipt)
        );
        
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Messages marked as read",
                receipts,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{messageId}")
    @Operation(summary = "Get all receipts for a message")
    public ResponseEntity<?> getMessageReceipts(@PathVariable UUID messageId) {
        
        List<MessageReceiptDTO> receipts = messageReceiptService.getMessageReceipts(messageId);
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Message receipts retrieved successfully",
                receipts,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread message count for a chat room")
    public ResponseEntity<?> getUnreadCount(@RequestParam UUID chatRoomId) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        Long count = messageReceiptService.getUnreadCount(chatRoomId, currentUser.getId());
        
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", count);
        
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Unread count retrieved successfully",
                response,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/unread/messages")
    @Operation(summary = "Get unread message IDs for a chat room")
    public ResponseEntity<?> getUnreadMessageIds(@RequestParam UUID chatRoomId) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        List<UUID> messageIds = messageReceiptService.getUnreadMessageIds(chatRoomId, currentUser.getId());
        
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "Unread message IDs retrieved successfully",
                messageIds,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all messages in a chat room as read")
    public ResponseEntity<?> markAllAsRead(@RequestParam UUID chatRoomId) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        messageReceiptService.markAllAsReadInChatRoom(chatRoomId, currentUser.getId());
        
        ApiResponse<?> apiResponse = new ApiResponse<>(
                HttpStatus.OK,
                "All messages marked as read",
                null,
                null
        );
        return ResponseEntity.ok(apiResponse);
    }
}
