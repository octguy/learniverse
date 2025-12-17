package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateGroupChatRequest;
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

import static java.util.Collections.emptyList;
import static java.util.stream.Collectors.*;

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

        return roomResponse(room, participantIds);
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

        return roomResponse(room, allParticipantIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        // get all rooms where the user is a participant (not contain participants)
        List<ChatRoom> rooms = chatRoomRepository.findChatRoomsByUserId(currentUser.getId());

        if (rooms.isEmpty()) {
            return new ArrayList<>();
        }

        return getRooms(rooms);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllDirectChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<ChatRoom> rooms = chatRoomRepository.findAllDirectChatRoomsByUserId(currentUser.getId());

        if (rooms.isEmpty()) {
            return new ArrayList<>();
        }

        return getRooms(rooms);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getAllGroupChatRooms() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<ChatRoom> rooms = chatRoomRepository.findAllGroupChatRoomsByUserId(currentUser.getId());

        if (rooms.isEmpty()) {
            return new ArrayList<>();
        }

        return getRooms(rooms);
    }


    private List<ChatRoomResponse> getRooms(List<ChatRoom> rooms) {
        // Get room Ids
        List<UUID> roomIds = rooms.stream()
                .map(ChatRoom::getId)
                .toList();

        // get all participants in these rooms
        // rows contain (roomId, participantId)
        // less depends on entity graph
        List<Object[]> rows = chatParticipantRepository.findAllParticipantsIdInRoomsId(roomIds);

        // Collect into a map (roomId: key, participants: value)
        Map<UUID, List<UUID>> participantsMap = rows
                .stream()
                .collect(groupingBy(
                        row -> (UUID) row[0],
                        mapping(row -> (UUID) row[1], toList())
                ));

        return rooms.stream()
                .map(room -> {
                    Set<UUID> participantIds = new HashSet<>(participantsMap.getOrDefault(room.getId(), emptyList()));
                    return roomResponse(room, participantIds);
                })
                .collect(toList());
    }

    private ChatParticipant createParticipant(ChatRoom room, User user, User invitedBy, GroupChatRole role) {
        ChatParticipant participant = new ChatParticipant();

        participant.setChatRoom(room);
        participant.setParticipant(user);
        participant.setInvitedBy(invitedBy);
        participant.setChatRole(role);

        return participant;
    }

    private ChatRoomResponse roomResponse(ChatRoom room, Set<UUID> participantIds) {
        return ChatRoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .isGroupChat(room.isGroupChat())
                .participants(participantIds)
                .createdAt(room.getCreatedAt())
                .build();
    }
}
