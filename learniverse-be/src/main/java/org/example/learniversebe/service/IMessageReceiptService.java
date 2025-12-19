package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.MessageReceiptDTO;

import java.util.List;
import java.util.UUID;

public interface IMessageReceiptService {
    
    /**
     * Mark a message as delivered for a user
     */
    MessageReceiptDTO markAsDelivered(UUID messageId, UUID userId);
    
    /**
     * Mark a message as read for a user
     */
    MessageReceiptDTO markAsRead(UUID messageId, UUID userId);
    
    /**
     * Mark multiple messages as read for a user
     */
    List<MessageReceiptDTO> markMultipleAsRead(List<UUID> messageIds, UUID userId);
    
    /**
     * Get all receipts for a message
     */
    List<MessageReceiptDTO> getMessageReceipts(UUID messageId);
    
    /**
     * Get unread message count for a user in a chat room
     */
    Long getUnreadCount(UUID chatRoomId, UUID userId);
    
    /**
     * Get all unread message IDs for a user in a chat room
     */
    List<UUID> getUnreadMessageIds(UUID chatRoomId, UUID userId);
    
    /**
     * Mark all messages in a chat room as read for a user
     */
    void markAllAsReadInChatRoom(UUID chatRoomId, UUID userId);
}
