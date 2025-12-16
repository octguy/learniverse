package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.ChatRoomResponse;

import java.util.UUID;

public interface IChatRoomService {

    ChatRoomResponse createDirectChatRoom(UUID recipientId);
}
