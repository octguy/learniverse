package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateGroupChatRequest;
import org.example.learniversebe.dto.response.ChatRoomResponse;
import org.example.learniversebe.dto.response.LastMessageResponse;
import org.example.learniversebe.enums.GroupChatRole;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IChatRoomService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.Collections.*;
import static java.util.stream.Collectors.*;

@Slf4j
@Service
public class ChatRoomServiceImpl implements IChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    private final UserRepository userRepository;

    private final ChatParticipantRepository chatParticipantRepository;

    private final ChatMessageRepository chatMessageRepository;

    public ChatRoomServiceImpl(ChatRoomRepository chatRoomRepository,
                               UserRepository userRepository,
                               ChatParticipantRepository chatParticipantRepository,
                               ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.userRepository = userRepository;
        this.chatRoomRepository = chatRoomRepository;
    }

    @Override
    @Transactional
    public ChatRoomResponse createDirectChat(UUID recipientId) {
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
            log.error("Direct chat room already exists");
            throw new RuntimeException("Direct chat room already exists");
        }

        User recipientUser = recipient.get();

        ChatRoom room = new ChatRoom();
        room.setGroupChat(false);
        room.setHost(null);

        chatRoomRepository.save(room);

        // Add participant
        Set<ChatParticipant> participants = new HashSet<>();
        participants.add(createParticipant(room, currentUser, null, GroupChatRole.MEMBER));
        participants.add(createParticipant(room, recipientUser, currentUser, GroupChatRole.MEMBER));

        chatParticipantRepository.saveAll(participants);

        Set<UUID> participantIds = participants.stream()
                .map(participant -> participant.getParticipant().getId())
                .collect(Collectors.toSet());


        log.info("Created direct chat room between {} and {}", currentUser.getUsername(), recipientUser.getUsername());

        return buildRoomResponse(room, currentUser.getId(), participantIds);
    }

    @Override
    @Transactional
    public ChatRoomResponse createGroupChat(CreateGroupChatRequest request) {
        User host = SecurityUtils.getCurrentUser();
        Set<UUID> participantIds = request.getParticipantIds();

        // Cannot create a group chat room with 2 participants
        if (participantIds.size() < 2) {
            log.error("Cannot create group chat room with less than 2 participants");
            throw new RuntimeException("Cannot create group chat room with less than 2 participants");
        }

        // Get participants by their Ids
        List<User> participants = userRepository.findAllById(participantIds);

        // Validate mismatch between participantIds size and participants size
        if (participants.size() != participantIds.size()) {
            log.error("Some participants not found");
            throw new RuntimeException("Some participants not found");
        }

        // Validate host is not a participant
        if (participantIds.contains(host.getId())) {
            log.error("Cannot create group chat room with yourself");
            throw new RuntimeException("Cannot create group chat room with yourself");
        }

        ChatRoom room = new ChatRoom();
        room.setGroupChat(true);
        room.setHost(host);
        room.setName(request.getName());

        chatRoomRepository.save(room);

        Set<ChatParticipant> chatParticipants = new HashSet<>();

        // Add host
        chatParticipants.add(createParticipant(room, host, null, GroupChatRole.ADMIN));

        // Add participants
        for (User participant : participants) {
            log.info("Adding participant {} to group chat room {}", participant.getUsername(), room.getName());
            chatParticipants.add(createParticipant(room, participant, host, GroupChatRole.MEMBER));
        }

        chatParticipantRepository.saveAll(chatParticipants);

        log.info("Created group chat {} with {} participants", room.getName(), participantIds.size());

        Set<UUID> allParticipantIds = new HashSet<>(participantIds);
        allParticipantIds.add(host.getId());

        return buildRoomResponse(room, host.getId(), allParticipantIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<ChatRoom> rooms = chatRoomRepository.findChatRoomsByUserId(currentUser.getId());

        return buildRoomResponses(rooms, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllDirectChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<ChatRoom> rooms = chatRoomRepository.findAllDirectChatRoomsByUserId(currentUser.getId());

        return buildRoomResponses(rooms, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllGroupChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<ChatRoom> rooms = chatRoomRepository.findAllGroupChatRoomsByUserId(currentUser.getId());

        return buildRoomResponses(rooms, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomById(UUID chatRoomId) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));

        Map<UUID, Set<UUID>> participantMap = loadParticipantMap(List.of(room.getId()));
        Set<UUID> participantIds = participantMap.getOrDefault(room.getId(), emptySet());

        return buildRoomResponse(room, currentUser.getId(), participantIds);
    }

    @Override
    @Transactional
    public void leaveChatRoom(UUID chatRoomId) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));

        if (!room.isGroupChat()) {
            log.error("Cannot leave direct chat room");
            throw new RuntimeException("Cannot leave direct chat room");
        }

        ChatParticipant participant = findParticipant(chatRoomId, currentUser.getId());

        // Count members
        long participantsCount = chatParticipantRepository.countByChatRoomId(chatRoomId);

        if (participant.getChatRole() == GroupChatRole.ADMIN) {
            handleAdminLeaving(chatRoomId, participantsCount, currentUser);
        }

        chatParticipantRepository.softDeleteByChatRoomIdAndParticipantId(chatRoomId, currentUser.getId());
        log.info("Left chat room {} by user id {}", room.getName(), currentUser.getId());
    }

    @Override
    public void deleteChatRoom(UUID chatRoomId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        chatRoomRepository.softDeleteChatRoom(chatRoomId);

        log.info("Deleted chat room {}", room.getName());
    }

    private ChatParticipant findParticipant(UUID chatRoomId, UUID participantId) {
        Optional<ChatParticipant> participant = chatParticipantRepository.findByChatRoomIdAndParticipantId(chatRoomId, participantId);

        if (participant.isEmpty()) {
            log.error("Participant not found in chat room {}", chatRoomId);
            throw new RuntimeException("Participant not found in chat room");
        }

        return participant.get();
    }

    private void handleAdminLeaving(UUID chatRoomId, long participantCount, User currentUser) {
        if (participantCount == 1) {
            deleteChatRoom(chatRoomId);
            return;
        }

        assignNewAdmin(chatRoomId, currentUser.getId());
    }

    private void assignNewAdmin(UUID chatRoomId, UUID leavingUserId) {
        List<ChatParticipant> others = chatParticipantRepository.findOtherParticipants(chatRoomId, leavingUserId);

        if (others.isEmpty()) {
            throw new RuntimeException("No participants to assign ADMIN role");
        }

        ChatParticipant newAdmin = others.get(0);
        newAdmin.setChatRole(GroupChatRole.ADMIN);
        chatParticipantRepository.save(newAdmin);
        log.info("Assigned new admin {} to chat room {}", newAdmin.getParticipant().getUsername(), chatRoomId);
    }

    private Map<UUID, Set<UUID>> loadParticipantMap(List<UUID> roomIds) {
        if (roomIds.isEmpty()) {
            return emptyMap();
        }

        // get all participants in these rooms
        // rows contain (roomId, participantId)
        // less depends on entity graph
        List<Object[]> rows = chatParticipantRepository.findAllParticipantsIdInRoomsId(roomIds);
        // rows: (roomId, participantId)

        return rows.stream()
                .collect(groupingBy(
                        row -> (UUID) row[0],
                        mapping(row -> (UUID) row[1], toSet())
                ));
    }

    private List<ChatRoomResponse> buildRoomResponses(List<ChatRoom> rooms, UUID currentUserId) {
        if (rooms.isEmpty()) {
            return emptyList();
        }

        List<UUID> roomIds = rooms.stream()
                .map(ChatRoom::getId)
                .toList();

        Map<UUID, Set<UUID>> participantMap = loadParticipantMap(roomIds);

        return rooms.stream()
                .map(room -> {
                    Set<UUID> participantIds = participantMap.getOrDefault(room.getId(), emptySet());
                    return buildRoomResponse(room, currentUserId, participantIds);
                })
                .toList();
    }

    private ChatRoomResponse buildRoomResponse(ChatRoom room, UUID currentUserId, Set<UUID> participantIds) {
        LastMessageResponse lastMessage = getLastMessageByRoom(room);
        Integer unreadCount = getUnreadCount(room.getId(), currentUserId);

        return ChatRoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .isGroupChat(room.isGroupChat())
                .participants(participantIds)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount != null ? unreadCount : 0)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatParticipant createParticipant(ChatRoom room, User user, User invitedBy, GroupChatRole role) {
        ChatParticipant participant = new ChatParticipant();

        participant.setChatRoom(room);
        participant.setParticipant(user);
        participant.setInvitedBy(invitedBy);
        participant.setChatRole(role);

        return participant;
    }

    private LastMessageResponse getLastMessageByRoom(ChatRoom room) {
        List<Object[]> results = chatMessageRepository.findLastMessageByChatRoomId(room.getId());

        if (results == null || results.isEmpty()) {
            return null;
        }

        try {
            Object[] msg = results.get(0);

            // Validate array has expected length
            if (msg.length < 4) {
                log.warn("Expected 4 columns but got {} for room {}", msg.length, room.getId());
                return null;
            }

            UUID senderId = msg[0] != null ? (UUID) msg[0] : null;
            String senderDisplayName = msg[1] != null ? msg[1].toString() : null;
            String messageType = msg[2] != null ? msg[2].toString() : null;
            String content = msg[3] != null ? msg[3].toString() : null;
            Timestamp createdAt = msg[4] != null ? (Timestamp) msg[4] : null;

            return LastMessageResponse.builder()
                    .senderId(senderId)
                    .senderName(senderDisplayName)
                    .messageType(messageType)
                    .content(content)
                    .sendAt(createdAt != null ? createdAt.toLocalDateTime() : null)
                    .build();
        } catch (Exception e) {
            log.error("Error processing last message data for room {}: {}", room.getId(), e.getMessage(), e);
            return null;
        }
    }

    private Integer getUnreadCount(UUID chatRoomId, UUID participantId) {
        return chatParticipantRepository.getUnreadCount(chatRoomId, participantId);
    }
}