package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.response.NotificationResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.NotificationType;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.NotificationMapper;
import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.model.Notification;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.NotificationRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.util.ServiceHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements INotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final ServiceHelper serviceHelper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Notification createNotification(UUID recipientId, UUID senderId, NotificationType type, String content, UUID relatedEntityId, String relatedEntityType) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recipientId.toString()));

        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId.toString()));
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());

        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setNotificationType(type);

        notification.setContent(content);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setIsRead(false);

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);

        Notification savedNotification = notificationRepository.save(notification);

        sendRealtimeNotification(savedNotification);

        return savedNotification;
    }

    @Override
    public void notifyNewAnswer(User questionAuthor, User answerAuthor, Answer answer) {
        if (questionAuthor.getId().equals(answerAuthor.getId())) return;

        createNotification(
                questionAuthor.getId(),
                answerAuthor.getId(),
                NotificationType.ANSWER,
                answerAuthor.getUsername() + " đã trả lời câu hỏi của bạn.",
                answer.getQuestion().getId(),
                "QUESTION"
        );
    }

    @Override
    public void notifyNewComment(User entityAuthor, User commentAuthor, Comment comment) {
        if (entityAuthor.getId().equals(commentAuthor.getId())) return;

        createNotification(
                entityAuthor.getId(),
                commentAuthor.getId(),
                NotificationType.COMMENT,
                commentAuthor.getUsername() + " đã bình luận về bài viết của bạn.",
                comment.getId(),
                "COMMENT"
        );
    }

    @Override
    public void notifyNewReply(User parentCommentAuthor, User replyAuthor, Comment reply) {
        if (parentCommentAuthor.getId().equals(replyAuthor.getId())) return;

        UUID relatedId = (reply.getParent() != null) ? reply.getParent().getId() : reply.getId();

        createNotification(
                parentCommentAuthor.getId(),
                replyAuthor.getId(),
                NotificationType.COMMENT,
                replyAuthor.getUsername() + " đã trả lời bình luận của bạn.",
                relatedId,
                "COMMENT"
        );
    }

    @Override
    public void notifyMentionedUsers(Set<User> mentionedUsers, User mentioner, Comment comment) {
        for (User mentionedUser : mentionedUsers) {
            if (mentionedUser.getId().equals(mentioner.getId())) continue;

            createNotification(
                    mentionedUser.getId(),
                    mentioner.getId(),
                    NotificationType.MENTION,
                    mentioner.getUsername() + " đã nhắc đến bạn trong một bình luận.",
                    comment.getId(),
                    "COMMENT"
            );
        }
    }

    @Override
    public void notifyAnswerAccepted(User answerAuthor, User questionAuthor, Answer answer) {
        if (answerAuthor.getId().equals(questionAuthor.getId())) return;

        createNotification(
                answerAuthor.getId(),
                questionAuthor.getId(),
                NotificationType.ANSWER_ACCEPTED,
                questionAuthor.getUsername() + " đã chấp nhận câu trả lời của bạn.",
                answer.getQuestion().getId(),
                "QUESTION"
        );
    }

    @Override
    public PageResponse<NotificationResponse> getNotifications(int page, int size) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> pageData = notificationRepository.findAllByRecipient_IdOrderByCreatedAtDesc(currentUserId, pageable);

        List<NotificationResponse> content = pageData.getContent().stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<NotificationResponse>builder()
                .content(content)
                .currentPage(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .first(pageData.isFirst())
                .numberOfElements(pageData.getNumberOfElements())
                .build();
    }

    @Override
    public long getUnreadNotificationCount() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        return notificationRepository.countByRecipient_IdAndIsReadFalse(currentUserId);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        notificationRepository.markAllAsReadByRecipientId(currentUserId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId.toString()));

        if (!notification.getRecipient().getId().equals(currentUserId)) {
            throw new RuntimeException("Notification " + notificationId.toString() + "does not belong to current user.");
        }

        notification.setIsRead(true);

        notification.setUpdatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    private void sendRealtimeNotification(Notification notification) {
        try {
            NotificationResponse response = notificationMapper.toResponse(notification);
            String destination = "/topic/notifications/" + notification.getRecipient().getId();

            // Gửi đến topic mà frontend đã subscribe trong websocketService.ts
            messagingTemplate.convertAndSend(destination, response);

            log.info("Đã gửi thông báo realtime tới người dùng: {}", notification.getRecipient().getUsername());
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo realtime qua WebSocket", e);
        }
    }
}