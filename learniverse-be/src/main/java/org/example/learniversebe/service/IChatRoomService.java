package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateGroupChatRequest;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.dto.response.MessagePageResponse;

import java.util.List;
import java.util.UUID;

public interface IChatRoomService {

    ChatRoomResponse createDirectChat(UUID recipientId);

    ChatRoomResponse createGroupChat(CreateGroupChatRequest request);

    List<ChatRoomResponse> getAllChatRooms();

    List<ChatRoomResponse> getAllDirectChatRooms();

    List<ChatRoomResponse> getAllGroupChatRooms();

    ChatRoomResponse getChatRoomById(UUID chatRoomId);

    MessagePageResponse getChatHistory(UUID chatRoomId, int page, int size);

    void leaveChatRoom(UUID chatRoomId);

    void deleteChatRoom(UUID chatRoomId);
}
