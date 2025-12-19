package org.example.learniversebe.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.response.MessageReceiptDTO;
import org.example.learniversebe.enums.MessageStatus;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.model.ChatMessage;
import org.example.learniversebe.model.MessageReceipt;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ChatMessageRepository;
import org.example.learniversebe.repository.MessageReceiptRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IMessageReceiptService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageReceiptServiceImpl implements IMessageReceiptService {

    private final MessageReceiptRepository messageReceiptRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public MessageReceiptDTO markAsDelivered(UUID messageId, UUID userId) {
        log.info("Marking message {} as delivered for user {}", messageId, userId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Check if receipt already exists
        MessageReceipt receipt = messageReceiptRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseGet(() -> {
                    MessageReceipt newReceipt = new MessageReceipt();
                    newReceipt.setMessage(message);
                    newReceipt.setUser(user);
                    newReceipt.setStatus(MessageStatus.DELIVERED);
                    return newReceipt;
                });
        
        // If not already delivered, set status
        if (receipt.getStatus() == MessageStatus.SENT) {
            receipt.setStatus(MessageStatus.DELIVERED);
        }
        
        receipt = messageReceiptRepository.save(receipt);
        
        return toDTO(receipt);
    }

    @Override
    @Transactional
    public MessageReceiptDTO markAsRead(UUID messageId, UUID userId) {
        log.info("Marking message {} as read for user {}", messageId, userId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Get or create receipt
        MessageReceipt receipt = messageReceiptRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseGet(() -> {
                    MessageReceipt newReceipt = new MessageReceipt();
                    newReceipt.setMessage(message);
                    newReceipt.setUser(user);
                    newReceipt.setStatus(MessageStatus.DELIVERED);
                    return newReceipt;
                });
        
        // Set status to READ
        receipt.setStatus(MessageStatus.READ);
        // readAt will be set automatically by @PreUpdate
        
        receipt = messageReceiptRepository.save(receipt);
        
        return toDTO(receipt);
    }

    @Override
    @Transactional
    public List<MessageReceiptDTO> markMultipleAsRead(List<UUID> messageIds, UUID userId) {
        log.info("Marking {} messages as read for user {}", messageIds.size(), userId);
        
        List<MessageReceiptDTO> receipts = new ArrayList<>();
        
        for (UUID messageId : messageIds) {
            try {
                MessageReceiptDTO receipt = markAsRead(messageId, userId);
                receipts.add(receipt);
            } catch (ResourceNotFoundException e) {
                log.warn("Message not found: {}", messageId);
            }
        }
        
        return receipts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageReceiptDTO> getMessageReceipts(UUID messageId) {
        log.info("Getting receipts for message {}", messageId);
        
        List<MessageReceipt> receipts = messageReceiptRepository.findByMessageId(messageId);
        
        return receipts.stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(UUID chatRoomId, UUID userId) {
        log.info("Getting unread count for user {} in chat room {}", userId, chatRoomId);
        
        return messageReceiptRepository.countUnreadMessages(chatRoomId, userId, MessageStatus.READ);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getUnreadMessageIds(UUID chatRoomId, UUID userId) {
        log.info("Getting unread message IDs for user {} in chat room {}", userId, chatRoomId);
        
        return messageReceiptRepository.findUnreadMessageIds(chatRoomId, userId, MessageStatus.READ);
    }

    @Override
    @Transactional
    public void markAllAsReadInChatRoom(UUID chatRoomId, UUID userId) {
        log.info("Marking all messages as read for user {} in chat room {}", userId, chatRoomId);
        
        List<UUID> unreadMessageIds = getUnreadMessageIds(chatRoomId, userId);
        markMultipleAsRead(unreadMessageIds, userId);
    }

    private MessageReceiptDTO toDTO(MessageReceipt receipt) {
        return MessageReceiptDTO.builder()
                .messageId(receipt.getMessage().getId())
                .userId(receipt.getUser().getId())
                .username(receipt.getUser().getUsername())
                .deliveredAt(receipt.getStatus() == MessageStatus.DELIVERED || receipt.getStatus() == MessageStatus.READ ? receipt.getCreatedAt() : null)
                .readAt(receipt.getReadAt())
                .isRead(receipt.getStatus() == MessageStatus.READ)
                .build();
    }
}
