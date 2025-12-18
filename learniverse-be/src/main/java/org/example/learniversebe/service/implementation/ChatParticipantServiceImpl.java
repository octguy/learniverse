package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.AddParticipantsRequest;
import org.example.learniversebe.dto.response.AddParticipantsResponse;
import org.example.learniversebe.enums.GroupChatRole;
import org.example.learniversebe.exception.UnauthorizedException;
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

import java.util.*;

import static java.util.stream.Collectors.toList;

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
        ChatRoom room = getChatRoom(chatRoomId);
        validateGroupChat(room, "Cannot add participants to direct chat");

        User currentUser = SecurityUtils.getCurrentUser();
        Set<UUID> participantsToAdd = new HashSet<>(request.getParticipants());

        validateAddParticipantsPermission(chatRoomId, currentUser.getId(), participantsToAdd);

        ParticipantSets participantSets = getParticipantSets(chatRoomId);
        validateNoActiveParticipants(chatRoomId, participantsToAdd, participantSets.active);

        Set<UUID> toRestore = getParticipantsToRestore(participantsToAdd, participantSets.old);
        Set<UUID> toAdd = getParticipantsToAdd(participantsToAdd, participantSets.old);

        restoreParticipants(chatRoomId, currentUser.getId(), toRestore);
        addNewParticipants(room, currentUser, toAdd);

        return buildAddParticipantsResponse(chatRoomId, participantsToAdd);
    }

    @Override
    @Transactional
    public void removeParticipant(UUID chatRoomId, UUID participantId) {
        ChatRoom room = getChatRoom(chatRoomId);
        validateGroupChat(room, "Cannot remove participant from direct chat");

        User currentUser = SecurityUtils.getCurrentUser();
        ChatParticipant currentParticipant = getCurrentParticipant(chatRoomId, currentUser.getId());

        validateRemovePermissions(currentUser.getId(), participantId, currentParticipant);

        ChatParticipant targetParticipant = getTargetParticipant(chatRoomId, participantId);
        validateNotRemovingAdmin(targetParticipant, chatRoomId);

        chatParticipantRepository.softDeleteByChatRoomIdAndParticipantId(chatRoomId, participantId);
        log.info("Removed participant {} from chat room {}", participantId, chatRoomId);
    }

    private ChatRoom getChatRoom(UUID chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> {
                    log.error("Chat room not found with id {}", chatRoomId);
                    return new RuntimeException("Chat room not found");
                });
    }

    private void validateGroupChat(ChatRoom room, String errMsg) {
        if (!room.isGroupChat()) {
            log.error(errMsg);
            throw new RuntimeException(errMsg);
        }
    }

    private void validateAddParticipantsPermission(UUID chatRoomId, UUID userId, Set<UUID> participantsToAdd) {
        if (!chatParticipantRepository.existsByChatRoomIdAndParticipantId(chatRoomId, userId)) {
            log.error("User {} is not allowed to add participants to this chat room {}", userId, chatRoomId);
            throw new UnauthorizedException("User is not allowed to add participants to this chat room");
        }

        if (participantsToAdd.contains(userId)) {
            log.error("User {} cannot add himself to this chat room {}", userId, chatRoomId);
            throw new UnauthorizedException("User cannot add himself to this chat room");
        }
    }

    private ParticipantSets getParticipantSets(UUID chatRoomId) {
        List<Object[]> rows = chatParticipantRepository.findParticipantStatesByChatRoomId(chatRoomId);

        Set<UUID> activeSet = new HashSet<>();
        Set<UUID> oldSet = new HashSet<>();

        for (Object[] row : rows) {
            UUID participantId = (UUID) row[0];
            Object deletedAt = row[1];

            if (deletedAt == null) activeSet.add(participantId);
            else oldSet.add(participantId);
        }

        return new ParticipantSets(activeSet, oldSet);
    }

    private void validateNoActiveParticipants(UUID chatRoomId, Set<UUID> participantsToAdd, Set<UUID> activeSet) {
        Set<UUID> duplicatedParticipants = new HashSet<>(participantsToAdd);
        duplicatedParticipants.retainAll(activeSet);

        if (!duplicatedParticipants.isEmpty()) {
            log.error("Cannot add participants who are currently active in the chat room {}, duplicated participant IDs: {}", chatRoomId, duplicatedParticipants);
            throw new RuntimeException("Cannot add participants who are currently active in the chat room");
        }
    }

    private Set<UUID> getParticipantsToRestore(Set<UUID> participantsToAdd, Set<UUID> oldSet) {
        Set<UUID> toRestore = new HashSet<>(participantsToAdd);
        toRestore.retainAll(oldSet);
        return toRestore;
    }

    private Set<UUID> getParticipantsToAdd(Set<UUID> participantsToAdd, Set<UUID> oldSet) {
        Set<UUID> toAdd = new HashSet<>(participantsToAdd);
        toAdd.removeAll(oldSet);
        return toAdd;
    }

    private void restoreParticipants(UUID chatRoomId, UUID userId, Set<UUID> toRestore) {
        if (!toRestore.isEmpty()) {
            chatParticipantRepository.restoreParticipants(chatRoomId, userId, toRestore);
            log.info("Restored participant IDs {} to chat room {}", toRestore, chatRoomId);
        }
    }

    private void addNewParticipants(ChatRoom room, User currentUser, Set<UUID> toAdd) {
        if (toAdd.isEmpty()) {
            return;
        }

        List<User> newParticipants = userRepository.findAllById(toAdd);
        validateAllParticipantsFound(toAdd, newParticipants);

        List<ChatParticipant> newChatParticipants = newParticipants.stream()
                .map(participant -> createChatParticipant(room, participant, currentUser))
                .collect(toList());

        chatParticipantRepository.saveAll(newChatParticipants);
        log.info("Added new participant IDs {} to chat room {}", toAdd, room.getId());

    }

    private void validateAllParticipantsFound(Set<UUID> requestedIds, List<User> foundUsers) {
        if (foundUsers.size() != requestedIds.size()) {
            log.error("Cannot find all participants with IDs: {}", requestedIds);
            throw new RuntimeException("Cannot find participants with specified IDs");
        }
    }

    private ChatParticipant createChatParticipant(ChatRoom chatRoom, User participant, User invitedBy) {
        ChatParticipant chatParticipant = new ChatParticipant();
        chatParticipant.setChatRoom(chatRoom);
        chatParticipant.setParticipant(participant);
        chatParticipant.setInvitedBy(invitedBy);
        chatParticipant.setChatRole(GroupChatRole.MEMBER);
        return chatParticipant;
    }

    private AddParticipantsResponse buildAddParticipantsResponse(UUID chatRoomId, Set<UUID> participantsToAdd) {
        return AddParticipantsResponse.builder()
                .chatRoomId(chatRoomId)
                .participants(participantsToAdd)
                .build();
    }

    private ChatParticipant getCurrentParticipant(UUID chatRoomId, UUID userId) {
        return chatParticipantRepository.findByChatRoomIdAndParticipantId(chatRoomId, userId)
                .orElseThrow(() -> {
                    log.error("User {} is not a participant in chat room {}", userId, chatRoomId);
                    return new RuntimeException("Participant not found in chat room");
                });
    }

    private void validateRemovePermissions(UUID currentUserId, UUID participantId, ChatParticipant currentParticipant) {
        if (participantId.equals(currentUserId)) {
            log.error("User {} cannot remove themselves from chat room {}", currentUserId, participantId);
            throw new UnauthorizedException("User cannot remove themselves from chat room");
        }

        if (currentParticipant.getChatRole() != GroupChatRole.ADMIN) {
            log.error("User {} is not allowed to remove participants (NOT ADMIN)", currentUserId);
            throw new UnauthorizedException("User is not allowed to remove participants");
        }
    }

    private ChatParticipant getTargetParticipant(UUID chatRoomId, UUID participantId) {
        return chatParticipantRepository.findByChatRoomIdAndParticipantId(chatRoomId, participantId)
                .orElseThrow(() -> {
                    log.error("Participant {} not found in chat room {}", participantId, chatRoomId);
                    return new RuntimeException("Participant not found in chat room");
                });
    }

    private void validateNotRemovingAdmin(ChatParticipant targetParticipant, UUID chatRoomId) {
        if (targetParticipant.getChatRole() == GroupChatRole.ADMIN) {
            log.error("Cannot remove admin from chat room {}", chatRoomId);
            throw new RuntimeException("Cannot remove admin from chat room");
        }
    }

    private record ParticipantSets(Set<UUID> active, Set<UUID> old) {}
}
