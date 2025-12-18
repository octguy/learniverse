package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;
import org.example.learniversebe.enums.GroupChatRole;
import org.example.learniversebe.model.ChatParticipant;
import org.example.learniversebe.model.ChatRoom;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ChatParticipantRepository;
import org.example.learniversebe.repository.ChatRoomRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IChatParticipantService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class ChatParticipantServiceImpl implements IChatParticipantService {

    private final ChatRoomRepository chatRoomRepository;

    private final UserRepository userRepository;

    private final ChatParticipantRepository chatParticipantRepository;

    public ChatParticipantServiceImpl(ChatRoomRepository chatRoomRepository,
                                      UserRepository userRepository,
                                      ChatParticipantRepository chatParticipantRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.userRepository = userRepository;
        this.chatParticipantRepository = chatParticipantRepository;
    }

    @Override
    @Transactional
    public AddParticipantsResponse addParticipant(UUID chatRoomId, AddParticipantsRequest request) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        if (!room.isGroupChat()) {
            log.error("Cannot add participants to direct chat");
            throw new RuntimeException("Cannot add participants to direct chat");
        }

        User currentUser = SecurityUtils.getCurrentUser();
        UUID userId = currentUser.getId();

        Set<UUID> participantsToAdd = new HashSet<>(request.getParticipants());

        // Check if the current user is allowed to add participants to this chat room
        if (!chatParticipantRepository.existsByChatRoomIdAndParticipantId(chatRoomId, userId)) {
            log.error("User {} is not allowed to add participants to this chat room {}", userId, chatRoomId);
            throw new RuntimeException("User is not allowed to add participants to this chat room");
        }

        // Check if the newbies contain the current user
        if (participantsToAdd.contains(userId)) {
            log.error("User {} cannot add himself to this chat room {}", userId, chatRoomId);
            throw new RuntimeException("User cannot add himself to this chat room");
        }

        // Query to get participant (include old participants)
        List<Object[]> rows = chatParticipantRepository.findParticipantStatesByChatRoomId(chatRoomId);
        Set<UUID> activeSet = new HashSet<>(); // participants who are currently active in the chat room
        Set<UUID> oldSet = new HashSet<>(); // participants who are old participants

        for (Object[] row : rows) {
            UUID participantId = (UUID) row[0];
            Object deletedAt = row[1];

            if (deletedAt == null) activeSet.add(participantId);
            else oldSet.add(participantId);
        }

        // Check if one of the newbies is currently active in the chat room
        Set<UUID> duplicatedParticipants = new HashSet<>(participantsToAdd);
        duplicatedParticipants.retainAll(activeSet);
        if (!duplicatedParticipants.isEmpty()) {
            log.error("Cannot add participants who are currently active in the chat room {}, duplicated participant IDs: {}", chatRoomId, duplicatedParticipants);
            throw new RuntimeException("Cannot add participants who are currently active in the chat room");
        }

        Set<UUID> toRestore = new HashSet<>(participantsToAdd);
        toRestore.retainAll(oldSet);

        Set<UUID> toAdd = new HashSet<>(participantsToAdd);
        toAdd.removeAll(oldSet);

        if (!toRestore.isEmpty()) {
            chatParticipantRepository.restoreParticipants(chatRoomId, userId, toRestore);
            log.info("Restored participant IDs {} to chat room {}", toRestore, chatRoomId);
        }

        if (!toAdd.isEmpty()) {
            List<User> newParticipants = userRepository.findAllById(toAdd);
            if (newParticipants.size() != toAdd.size()) {
                log.error("Cannot find participants with IDs: {}", toAdd);
                throw new RuntimeException("Cannot find participants with ids");
            }

            List<ChatParticipant> newbies = newParticipants.stream()
                    .map(np -> {
                        ChatParticipant chatParticipant = new ChatParticipant();
                        chatParticipant.setChatRoom(room);
                        chatParticipant.setParticipant(np);
                        chatParticipant.setInvitedBy(currentUser);
                        chatParticipant.setChatRole(GroupChatRole.MEMBER);
                        return chatParticipant;
                    }).toList();

            chatParticipantRepository.saveAll(newbies);
            log.info("Added new participant IDs {} to chat room {}", toAdd, chatRoomId);
        }

        return AddParticipantsResponse.builder()
                .chatRoomId(chatRoomId)
                .participants(participantsToAdd)
                .build();
    }
}
