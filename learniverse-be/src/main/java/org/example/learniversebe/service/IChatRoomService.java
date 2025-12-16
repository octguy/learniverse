package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.ChatRoomResponse;

import java.util.List;
import java.util.UUID;

public interface IChatRoomService {

    ChatRoomResponse createDirectChatRoom(UUID recipientId);

    List<ChatRoomResponse> getAllChatRoomsByUser();

}
