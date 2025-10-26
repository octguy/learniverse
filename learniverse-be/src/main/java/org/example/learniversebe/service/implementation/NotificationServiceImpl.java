package org.example.learniversebe.service.implementation;

import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.model.User;
import org.example.learniversebe.service.INotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Basic implementation of INotificationService.
 * Currently logs notifications to the console.
 * TODO: Replace with actual notification sending logic (email, WebSocket, push notifications).
 */
@Service
public class NotificationServiceImpl implements INotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    // Inject dependencies like EmailService, SimpMessagingTemplate (for WebSocket) etc. here
    // private final IEmailService emailService;
    // private final SimpMessagingTemplate messagingTemplate;

    // public NotificationServiceImpl(IEmailService emailService, SimpMessagingTemplate messagingTemplate) {
    //     this.emailService = emailService;
    //     this.messagingTemplate = messagingTemplate;
    // }


    @Override
    public void notifyNewAnswer(User questionAuthor, User answerAuthor, Answer answer) {
        // Basic logging implementation
        log.info("NOTIFICATION: User '{}' answered question '{}' by user '{}'. Answer ID: {}",
                answerAuthor.getUsername(), answer.getQuestion().getId(), questionAuthor.getUsername(), answer.getId());

        // TODO: Implement actual notification sending (e.g., in-app notification record, WebSocket push)
        // String notificationMessage = String.format("%s answered your question.", answerAuthor.getUsername());
        // createInAppNotification(questionAuthor, notificationMessage, "/questions/" + answer.getQuestion().getId() + "#answer-" + answer.getId());
        // sendWebSocketNotification(questionAuthor.getId(), notificationMessage);
    }

    @Override
    public void notifyNewComment(User entityAuthor, User commentAuthor, Comment comment) {
        log.info("NOTIFICATION: User '{}' commented on {} '{}' by user '{}'. Comment ID: {}",
                commentAuthor.getUsername(), comment.getCommentableType().toLowerCase(), comment.getCommentableId(),
                entityAuthor.getUsername(), comment.getId());

        // TODO: Implement actual notification sending
    }

    @Override
    public void notifyNewReply(User parentCommentAuthor, User replyAuthor, Comment reply) {
        log.info("NOTIFICATION: User '{}' replied to comment '{}' by user '{}'. Reply ID: {}",
                replyAuthor.getUsername(), reply.getParent().getId(), parentCommentAuthor.getUsername(), reply.getId());

        // TODO: Implement actual notification sending
    }

    @Override
    public void notifyMentionedUsers(Set<User> mentionedUsers, User mentioner, Comment comment) {
        for (User mentioned : mentionedUsers) {
            log.info("NOTIFICATION: User '{}' mentioned user '{}' in comment '{}'.",
                    mentioner.getUsername(), mentioned.getUsername(), comment.getId());
            // TODO: Implement actual notification sending for each mentioned user
        }
    }

    @Override
    public void notifyAnswerAccepted(User answerAuthor, User questionAuthor, Answer answer) {
        log.info("NOTIFICATION: User '{}' accepted answer '{}' by user '{}' for question '{}'.",
                questionAuthor.getUsername(), answer.getId(), answerAuthor.getUsername(), answer.getQuestion().getId());

        // TODO: Implement actual notification sending to answerAuthor
    }

    // --- Helper methods for actual notification sending (examples) ---
    /*
    private void createInAppNotification(User recipient, String message, String link) {
        // Logic to save notification to a Notification entity in the database
    }

    private void sendWebSocketNotification(UUID userId, String message) {
        // Logic to send message via SimpMessagingTemplate to a user-specific topic
        // messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", message);
    }

    private void sendEmailNotification(User recipient, String subject, String body) {
        // Logic using IEmailService
        // try { emailService.sendEmail(...); } catch (MessagingException e) { log.error(...) }
    }
    */
}