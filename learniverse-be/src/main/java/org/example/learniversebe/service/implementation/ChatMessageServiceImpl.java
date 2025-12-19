package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.EditMessageRequest;
import org.example.learniversebe.dto.request.SendMessageRequest;
import org.example.learniversebe.dto.response.MessagePageResponse;
import org.example.learniversebe.dto.response.MessageResponse;
import org.example.learniversebe.dto.response.pagination.PageResponse;
import org.example.learniversebe.dto.response.SenderResponse;
import org.example.learniversebe.dto.response.pagination.PaginationMeta;
import org.example.learniversebe.enums.MessageType;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.model.ChatMessage;
import org.example.learniversebe.model.ChatParticipant;
import org.example.learniversebe.model.ChatRoom;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ChatMessageRepository;
import org.example.learniversebe.repository.ChatParticipantRepository;
import org.example.learniversebe.repository.ChatRoomRepository;
import org.example.learniversebe.repository.projection.ChatMessageProjection;
import org.example.learniversebe.service.IChatMessageService;
import org.example.learniversebe.util.SecurityUtils;
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
    private final Cloudinary cloudinary;

    public ChatMessageServiceImpl(ChatMessageRepository chatMessageRepository,
                                  ChatRoomRepository chatRoomRepository,
                                  ChatParticipantRepository chatParticipantRepository,
                                  Cloudinary cloudinary) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.cloudinary = cloudinary;
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        User sender = SecurityUtils.getCurrentUser();

        // Validate chat room exists
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Validate sender is participant
        validateParticipant(chatRoom.getId(), sender.getId());

        // Validate text content for TEXT messages
        if (request.getMessageType() == MessageType.TEXT &&
            (request.getTextContent() == null || request.getTextContent().trim().isEmpty())) {
            throw new IllegalArgumentException("Text content is required for text messages");
        }

        ChatMessage message = new ChatMessage();
        message.setChatRoom(chatRoom);
        message.setSender(sender);
        message.setMessageType(request.getMessageType());
        message.setTextContent(request.getTextContent());
//        message.setSendAt(LocalDateTime.now());

        // Handle parent message (reply)
        if (request.getParentMessageId() != null) {
            ChatMessage parentMessage = chatMessageRepository.findById(request.getParentMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent message not found"));
            message.setParentMessage(parentMessage);
        }

        chatMessageRepository.save(message);
        log.info("Message sent by user {} in chat room {}", sender.getUsername(), chatRoom.getId());

        return mapToMessageResponse(message);
    }

    @Override
    @Transactional
    public MessageResponse sendMessageWithFile(SendMessageRequest request, MultipartFile file) {
        User sender = SecurityUtils.getCurrentUser();

        // Validate chat room exists
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Validate sender is participant
        validateParticipant(chatRoom.getId(), sender.getId());

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
//        message.setSendAt(LocalDateTime.now());

        // Handle parent message (reply)
        if (request.getParentMessageId() != null) {
            ChatMessage parentMessage = chatMessageRepository.findById(request.getParentMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent message not found"));
            message.setParentMessage(parentMessage);
        }

        chatMessageRepository.save(message);
        log.info("Message with file sent by user {} in chat room {}", sender.getUsername(), chatRoom.getId());

        return mapToMessageResponse(message);
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

        return mapToMessageResponse(message);
    }

    @Override
    @Transactional
    public void deleteMessage(UUID messageId) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // Only sender can delete their message
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own messages");
        }

        message.setDeletedAt(LocalDateTime.now());
        chatMessageRepository.save(message);

        log.info("Message {} deleted by user {}", messageId, currentUser.getUsername());
    }

    @Override
    public PageResponse<MessageResponse> getAllMessagesInChatRoom(UUID chatRoomId,
                                                                  LocalDateTime cursor,
                                                                  int limit) {
        User currentUser = SecurityUtils.getCurrentUser();
        boolean isParticipant = chatParticipantRepository.existsByChatRoomIdAndParticipantId(chatRoomId, currentUser.getId());

        if (!isParticipant) {
            log.error("User {} is not authorized to view messages in chat room {}", currentUser.getId(), chatRoomId);
            throw new UnauthorizedException("You must be a participant to view chat room messages");
        }

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
    public MessagePageResponse getMessagesBefore(UUID messageId) {
        return null;
    }

//    @Override
//    @Transactional(readOnly = true)
//    public MessagePageResponse getMessagesByChatRoom(UUID chatRoomId, int page, int size) {
//        User currentUser = SecurityUtils.getCurrentUser();
//
//        // Validate chat room exists
//        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
//                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
//
//        // Validate user is participant
//        validateParticipant(chatRoomId, currentUser.getId());
//
//        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
//        Page<ChatMessage> messagePage = chatMessageRepository.findByChatRoomId(chatRoomId, pageable);
//
//        List<MessageResponse> messages = messagePage.getContent().stream()
//                .map(this::mapToMessageResponse)
//                .collect(Collectors.toList());
//
//        MessagePageResponse response = new MessagePageResponse();
//        response.setMessages(messages);
//        response.setCurrentPage(messagePage.getNumber());
//        response.setTotalPages(messagePage.getTotalPages());
//        response.setTotalElements(messagePage.getTotalElements());
//        response.setHasNext(messagePage.hasNext());
//        response.setHasPrevious(messagePage.hasPrevious());
//
//        return response;
//    }

    @Override
    @Transactional(readOnly = true)
    public MessageResponse getMessageById(UUID messageId) {
        User currentUser = SecurityUtils.getCurrentUser();

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // Validate user is participant in the chat room
        validateParticipant(message.getChatRoom().getId(), currentUser.getId());

        return mapToMessageResponse(message);
    }

    private void validateParticipant(UUID chatRoomId, UUID userId) {
        ChatParticipant participant = chatParticipantRepository
                .findByChatRoomIdAndParticipantId(chatRoomId, userId)
                .orElseThrow(() -> new UnauthorizedException("You are not a participant of this chat room"));
    }

    private MessageResponse mapToMessageResponse(ChatMessage message) {
//        MessageResponse response = new MessageResponse();
//        response.setId(message.getId());
//        response.setChatRoomId(message.getChatRoom().getId());
////        response.setSenderId(message.getSender().getId());
////        response.setSenderName(message.getSender().getUsername());
////        response.setSenderAvatar(null); // Avatar field not yet implemented in User model
//        response.setMessageType(message.getMessageType());
//        response.setTextContent(message.getTextContent());
//        response.setMetadata(message.getMetadata());
//        response.setParentMessageId(message.getParentMessage() != null ? message.getParentMessage().getId() : null);
////        response.setSendAt(message.getSendAt());
//        response.setCreatedAt(message.getCreatedAt());
//        response.setUpdatedAt(message.getUpdatedAt());
//        response.setEdited(!message.getCreatedAt().equals(message.getUpdatedAt()));

        return null;
    }
}
