package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.NotificationResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.NotificationType;
import org.example.learniversebe.model.Answer;
import org.example.learniversebe.model.Comment;
import org.example.learniversebe.model.Notification;
import org.example.learniversebe.model.User;

import java.util.Set;
import java.util.UUID;

/**
 * Interface for handling notification logic.
 * Implementations might send emails, push notifications, or create in-app notifications.
 */
public interface INotificationService {

    /**
     * Notifies the author of a question when a new answer is posted.
     * @param questionAuthor The author of the question.
     * @param answerAuthor The author of the new answer.
     * @param answer The new answer entity.
     */
    void notifyNewAnswer(User questionAuthor, User answerAuthor, Answer answer);

    /**
     * Notifies the author of a content/answer when a new top-level comment is posted.
     * @param entityAuthor The author of the content or answer being commented on.
     * @param commentAuthor The author of the new comment.
     * @param comment The new comment entity.
     */
    void notifyNewComment(User entityAuthor, User commentAuthor, Comment comment);

    /**
     * Notifies the author of a parent comment when a new reply is posted.
     * @param parentCommentAuthor The author of the parent comment.
     * @param replyAuthor The author of the reply.
     * @param reply The new reply (comment) entity.
     */
    void notifyNewReply(User parentCommentAuthor, User replyAuthor, Comment reply);


    /**
     * Notifies users who were mentioned in a comment.
     * @param mentionedUsers The set of users who were mentioned.
     * @param mentioner The user who made the mention.
     * @param comment The comment containing the mention.
     */
    void notifyMentionedUsers(Set<User> mentionedUsers, User mentioner, Comment comment);

    /**
     * Notifies the answer author when their answer is marked as accepted.
     * @param answerAuthor The author of the accepted answer.
     * @param questionAuthor The author of the question of who accepted the answer.
     * @param answer The accepted answer entity.
     */
    void notifyAnswerAccepted(User answerAuthor, User questionAuthor, Answer answer);

    // Add other notification methods as needed (e.g., new follower, group invite, etc.)
    Notification createNotification(UUID recipientId, UUID senderId, NotificationType type, String content, UUID relatedEntityId, String relatedEntityType);
    PageResponse<NotificationResponse> getNotifications(int page, int size);
    long getUnreadNotificationCount();
    void markAllAsRead();
    NotificationResponse markAsRead(UUID notificationId);
}
