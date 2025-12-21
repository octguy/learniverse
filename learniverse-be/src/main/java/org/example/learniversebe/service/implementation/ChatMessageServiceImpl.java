package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.EditMessageRequest;
import org.example.learniversebe.dto.request.SendFileMessageRequest;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessageResponse;
import org.example.learniversebe.dto.response.pagination.PageResponse;
import org.example.learniversebe.dto.response.SenderResponse;
import org.example.learniversebe.dto.response.pagination.PaginationMeta;
import org.example.learniversebe.dto.websocket.ChatSocketEvent;
import org.example.learniversebe.dto.websocket.ReadReceiptDTO;
import org.example.learniversebe.enums.MessageType;
import org.example.learniversebe.enums.SocketEventType;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.ChatMessageRepository;
import org.example.learniversebe.repository.ChatParticipantRepository;
import org.example.learniversebe.repository.ChatRoomRepository;
import org.example.learniversebe.repository.UserProfileRepository;
import org.example.learniversebe.repository.projection.ChatMessageProjection;
import org.example.learniversebe.service.IChatMessageService;
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ChatMessageServiceImpl implements IChatMessageService {

    private final ChatMessageRepository chatMessageRepository;

    private final ChatRoomRepository chatRoomRepository;

    private final ChatParticipantRepository chatParticipantRepository;

    private final UserProfileRepository userProfileRepository;

    private final Cloudinary cloudinary;

    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageServiceImpl(ChatMessageRepository chatMessageRepository,
                                  ChatRoomRepository chatRoomRepository,
                                  ChatParticipantRepository chatParticipantRepository,
                                  UserProfileRepository userProfileRepository,
                                  SimpMessagingTemplate messagingTemplate,
                                  Cloudinary cloudinary) {
        this.userProfileRepository = userProfileRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.messagingTemplate = messagingTemplate;
        this.cloudinary = cloudinary;
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(UUID roomId, SendMessageRequest request) {
        User sender = SecurityUtils.getCurrentUser();
        UserProfile senderProfile = userProfileRepository.findByUserId(sender.getId());

        if (senderProfile == null) {
            log.error("UserProfile not found for user {}", sender.getId());
            throw new ResourceNotFoundException("User profile not found");
        }

        // Validate chat room exists
        ChatRoom chatRoom = getChatRoom(roomId);

        // Validate sender is participant
        ChatParticipant participant = getParticipant(chatRoom.getId(), sender.getId());

        ChatMessage message = new ChatMessage();

        message.setChatRoom(chatRoom);
        message.setSender(sender);
        message.setMessageType(MessageType.TEXT);
        message.setTextContent(request.getTextContent());

        // Handle parent message (reply)
        if (request.getParentMessageId() != null) {
            ChatMessage parentMessage = chatMessageRepository.findById(request.getParentMessageId())
                    .orElseThrow(() -> {
                        log.error("Parent message {} not found", request.getParentMessageId());
                        return new ResourceNotFoundException("Parent message not found");
                    });
            message.setParentMessage(parentMessage);
        }

        chatMessageRepository.save(message);
        log.info("Message sent by user {} in chat room {}", sender.getUsername(), chatRoom.getId());

        MessageResponse response = MessageResponse.builder()
                                        .id(message.getId())
                                        .chatRoomId(roomId)
                                        .sender(SenderResponse.builder()
                                                .senderId(sender.getId())
                                                .senderName(senderProfile.getDisplayName())
                                                .senderAvatar(senderProfile.getAvatarUrl())
                                                .build())
                                        .messageType(message.getMessageType().toString())
                                        .textContent(message.getTextContent())
                                        .metadata(message.getMetadata())
                                        .parentMessageId(request.getParentMessageId())
                                        .createdAt(message.getCreatedAt())
                                        .build();

        ChatSocketEvent event = ChatSocketEvent.builder()
                .eventType(SocketEventType.NEW_MESSAGE)
                .data(response)
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, event);
        log.debug("Message broadcasted to chat room {}", roomId);

        participant.setLastReadAt(LocalDateTime.now());
        chatParticipantRepository.save(participant);

        return response;
    }

    @Override
    @Transactional
    public MessageResponse sendMessageWithFile(UUID roomId, SendFileMessageRequest request, MultipartFile file) {
        UUID userId = SecurityUtils.getCurrentUser().getId();
        UserProfile senderProfile = userProfileRepository.findByUserId(userId);
        User sender = SecurityUtils.getCurrentUser();

        // Validate chat room exists
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Validate sender is participant
        getParticipant(roomId, userId);

        // Validate file is provided
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        // Upload file to Cloudinary
        String fileUrl;
        try {
            Map uploadResult;

            if (request.getMessageType() == MessageType.IMAGE) {
                uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("folder", "learniverse/chat/images"));
            } else if (request.getMessageType() == MessageType.VIDEO) {
                uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "learniverse/chat/videos",
                                "resource_type", "video"
                        ));
            } else {
                // For files
                uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "learniverse/chat/files",
                                "resource_type", "raw"
                        ));
            }

            fileUrl = (String) uploadResult.get("secure_url");
            log.info("File uploaded to Cloudinary: {}", fileUrl);
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new RuntimeException("Failed to upload file", e);
        }

        ChatMessage message = new ChatMessage();
        message.setChatRoom(chatRoom);
        message.setSender(sender);
        message.setMessageType(request.getMessageType());
        message.setTextContent(request.getTextContent()); // Optional caption
        message.setMetadata(fileUrl);

        // Handle parent message (reply)
        if (request.getParentMessageId() != null) {
            ChatMessage parentMessage = chatMessageRepository.findById(request.getParentMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent message not found"));
            message.setParentMessage(parentMessage);
        }

        chatMessageRepository.save(message);
        log.info("Message with file sent by user {} in chat room {}", sender.getUsername(), chatRoom.getId());

        // Build response
        MessageResponse response = MessageResponse.builder()
                .id(message.getId())
                .chatRoomId(roomId)
                .sender(SenderResponse.builder()
                        .senderId(sender.getId())
                        .senderName(senderProfile.getDisplayName())
                        .senderAvatar(senderProfile.getAvatarUrl())
                        .build())
                .messageType(message.getMessageType().toString())
                .textContent(message.getTextContent())
                .metadata(message.getMetadata())
                .parentMessageId(request.getParentMessageId())
                .createdAt(message.getCreatedAt())
                .build();

        // Broadcast via WebSocket with ChatSocketEvent wrapper
        ChatSocketEvent event = ChatSocketEvent.builder()
                .eventType(SocketEventType.NEW_MESSAGE)
                .data(response)
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, event);

        return response;
    }

    @Override
    @Transactional
    public MessageResponse editMessage(EditMessageRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatMessage message = chatMessageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // Only sender can edit their message
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own messages");
        }

        // Can only edit text messages
        if (message.getMessageType() != MessageType.TEXT) {
            throw new IllegalArgumentException("Can only edit text messages");
        }

        message.setTextContent(request.getTextContent());
        chatMessageRepository.save(message);

        log.info("Message {} edited by user {}", message.getId(), currentUser.getUsername());

        return null;
    }

    @Override
    public PageResponse<MessageResponse> getAllMessagesInChatRoom(UUID chatRoomId,
                                                                  LocalDateTime cursor,
                                                                  int limit) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatParticipant participant = getParticipant(chatRoomId, currentUser.getId());

        List<ChatMessageProjection> projections = chatMessageRepository.findMessagesByChatRoomId(chatRoomId, cursor, limit);

        List<MessageResponse> data = projections.stream()
                .map(
            p -> MessageResponse.builder()
                    .id(p.getId())
                    .chatRoomId(p.getChatRoomId())
                    .sender(
                        SenderResponse.builder()
                            .senderId(p.getSenderId())
                            .senderName(p.getSenderName())
                            .senderAvatar(p.getSenderAvatar())
                            .build()
                    )
                    .messageType(p.getMessageType())
                    .textContent(p.getTextContent())
                    .metadata(p.getMetadata())
                    .parentMessageId(p.getParentMessageId())
                    .createdAt(p.getSendAt())
                    .build()
                ).toList();

        LocalDateTime nextCursor = null;
        boolean hasNext = false;

        if (!data.isEmpty()) {
            nextCursor = data.get(data.size() - 1).getCreatedAt();

            hasNext = chatMessageRepository.existsByChatRoomIdAndCreatedAtBefore(chatRoomId, nextCursor);
        }

        return PageResponse.<MessageResponse>builder()
                .data(data)
                .pagination(
                    PaginationMeta.builder()
                        .nextCursor(nextCursor)
                        .hasNext(hasNext)
                        .build()
                )
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MessageResponse getMessageById(UUID messageId) {
//        User currentUser = SecurityUtils.getCurrentUser();
//
//        ChatMessage message = chatMessageRepository.findById(messageId)
//                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
//
//        // Validate user is participant in the chat room
//        validateParticipant(message.getChatRoom().getId(), currentUser.getId());
//
//        return mapToMessageResponse(message);
        return null;
    }

    @Override
    @Transactional
    public void markAsRead(UUID roomId) {
        UUID userId = SecurityUtils.getCurrentUser().getId();
        UserProfile profile = userProfileRepository.findByUserId(userId);
        ChatParticipant participant = getParticipant(roomId, userId);

        LocalDateTime now = LocalDateTime.now();

        participant.setLastReadAt(now);
        chatParticipantRepository.save(participant);

        ReadReceiptDTO receiptDto = ReadReceiptDTO.builder()
                .userId(userId)
                .avatarUrl(profile.getAvatarUrl())
                .readAt(now)
                .build();

        ChatSocketEvent event = ChatSocketEvent.builder()
                .eventType(SocketEventType.MESSAGE_RECEIPT)
                .data(receiptDto)
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, event);

        log.info("User {} marked messages as read in chat room {}", userId, roomId);
    }

    private ChatRoom getChatRoom(UUID chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> {
                    log.error("Chat room {} not found", chatRoomId);
                    return new ResourceNotFoundException("Chat room not found");
                });
    }

    private ChatParticipant getParticipant(UUID chatRoomId, UUID userId) {
        return chatParticipantRepository
                .findByChatRoomIdAndParticipantId(chatRoomId, userId)
                .orElseThrow(() -> {
                    log.error("User {} is not a participant in chat room {}", userId, chatRoomId);
                    return new UnauthorizedException("You must be a participant to perform this action");
                });
    }
}
