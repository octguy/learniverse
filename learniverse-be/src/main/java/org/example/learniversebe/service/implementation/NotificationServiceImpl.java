package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.model.Notification;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.NotificationRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.INotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Basic implementation of INotificationService.
 * Currently logs notifications to the console.
 * TODO: Replace with actual notification sending logic (email, WebSocket, push notifications).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements INotificationService {

    // Inject dependencies like EmailService, SimpMessagingTemplate (for WebSocket) etc. here
    // private final IEmailService emailService;
    // private final SimpMessagingTemplate messagingTemplate;

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setNotificationType(type);

        notification.setContent(content);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRead(false);

        return notificationRepository.save(notification);
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

        // FIX: Đổi reply.getParentComment() thành reply.getParent()
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

        // Lưu ý: Sửa lại query trong Repository thành findByRecipient_IdOrderByCreatedAtDesc nếu chưa sửa
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
            throw new ResourceNotFoundException("Notification", "id", notificationId.toString());
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }
}