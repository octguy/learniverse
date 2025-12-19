package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.EditMessageRequest;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessagePageResponse;
import org.example.learniversebe.dto.response.MessageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface IChatMessageService {
    
    MessageResponse sendMessage(SendMessageRequest request);
    
    MessageResponse sendMessageWithFile(SendMessageRequest request, MultipartFile file);
    
    MessageResponse editMessage(EditMessageRequest request);
    
    void deleteMessage(UUID messageId);
    
    MessagePageResponse getMessagesByChatRoom(UUID chatRoomId, int page, int size);
    
    MessageResponse getMessageById(UUID messageId);
}
