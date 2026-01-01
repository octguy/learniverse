package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.EditMessageRequest;
import org.example.learniversebe.dto.request.SendFileMessageRequest;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessageResponse;
import org.example.learniversebe.dto.response.pagination.PageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

public interface IChatMessageService {
    
    MessageResponse sendMessage(UUID roomId, SendMessageRequest request);
    
    MessageResponse sendMessageWithFile(UUID roomId, SendFileMessageRequest request, MultipartFile file);
    
    MessageResponse editMessage(EditMessageRequest request);

    PageResponse<MessageResponse> getAllMessagesInChatRoom(UUID chatRoomId, LocalDateTime cursor, int limit);

    MessageResponse getMessageById(UUID messageId);

    void markAsRead(UUID roomId);
}
