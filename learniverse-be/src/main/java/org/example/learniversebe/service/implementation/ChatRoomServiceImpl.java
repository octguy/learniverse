package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ChatRoomRepository;
import org.example.learniversebe.service.IChatRoomService;
import org.example.learniversebe.util.SecurityUtils;

import java.util.UUID;

@Slf4j
public class ChatRoomServiceImpl implements IChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    public ChatRoomServiceImpl(ChatRoomRepository chatRoomRepository) {
        this.chatRoomRepository = chatRoomRepository;
    }

    @Override
    public ChatRoomResponse createDirectChatRoom(UUID recipientId) {
        User currentUser = SecurityUtils.getCurrentUser();
        return null;
    }
}
