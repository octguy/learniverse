package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.enums.GroupChatRole;
import org.example.learniversebe.model.ChatParticipant;
import org.example.learniversebe.model.ChatRoom;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ChatParticipantRepository;
import org.example.learniversebe.repository.ChatRoomRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IChatRoomService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatRoomServiceImpl implements IChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    private final UserRepository userRepository;

    private final ChatParticipantRepository chatParticipantRepository;

    public ChatRoomServiceImpl(ChatRoomRepository chatRoomRepository,
                               UserRepository userRepository,
                               ChatParticipantRepository chatParticipantRepository) {
        this.chatParticipantRepository = chatParticipantRepository;
        this.userRepository = userRepository;
        this.chatRoomRepository = chatRoomRepository;
    }

    @Override
    @Transactional
    public ChatRoomResponse createDirectChatRoom(UUID recipientId) {
        User currentUser = SecurityUtils.getCurrentUser();

        Optional<User> recipient = userRepository.findById(recipientId);

        if (recipient.isEmpty()) {
            log.error("Recipient not found with id: {}", recipientId);
            throw new RuntimeException("Recipient not found");
        }

        if (currentUser.getId().equals(recipientId)) {
            log.error("Cannot create direct chat room with yourself");
            throw new RuntimeException("Cannot create direct chat room with yourself");
        }

        Optional<ChatRoom> existingRoom = chatRoomRepository.existsDirectMessage(currentUser.getId(), recipientId);

        if (existingRoom.isPresent()) {
            throw new RuntimeException("Direct chat room already exists");
        }

        User recipientUser = recipient.get();

        ChatRoom room = new ChatRoom();
        room.setGroupChat(false);
        room.setHost(null);

        chatRoomRepository.save(room);

        // Add participant
        Set<ChatParticipant> participants = new HashSet<>();
        participants.add(chatParticipantRepository.save(createChatParticipant(room, currentUser, null)));
        participants.add(chatParticipantRepository.save(createChatParticipant(room, recipientUser, currentUser)));

        log.info("Created direct chat room between {} and {}", currentUser.getUsername(), recipientUser.getUsername());

        return roomResponse(room, participants);
    }

    @Override
    public List<ChatRoomResponse> getAllChatRoomsByUser() {
        User currentUser = SecurityUtils.getCurrentUser();
        List<ChatRoom> rooms = chatRoomRepository.findChatRoomsByUserId(currentUser.getId());
        return rooms.stream().map(room -> roomResponse(room, null)).collect(Collectors.toList());
    }


    private ChatParticipant createChatParticipant(ChatRoom room, User user, User invitedBy) {
        ChatParticipant participant = new ChatParticipant();

        participant.setChatRoom(room);
        participant.setParticipant(user);
        participant.setInvitedBy(invitedBy);
        participant.setChatRole(GroupChatRole.MEMBER);

        return participant;
    }

    private ChatRoomResponse roomResponse(ChatRoom room, Set<ChatParticipant> participants) {
        Set<UUID> memberIds;

        if (participants != null) {
            memberIds = participants.stream()
                    .map(participant -> participant.getParticipant().getId())
                    .collect(Collectors.toSet());
        }
        else {
            memberIds = chatParticipantRepository.findByChatRoomId(room.getId()).stream()
                    .map(participant -> participant.getParticipant().getId())
                    .collect(Collectors.toSet());
        }

        return ChatRoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .isGroupChat(room.isGroupChat())
                .members(memberIds)
                .createdAt(room.getCreatedAt())
                .build();
    }
}
