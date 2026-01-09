package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.request.SendNotificationRequest;
import org.example.learniversebe.dto.request.UpdateUserRoleRequest;
import org.example.learniversebe.dto.request.UpdateUserStatusRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.DashboardPeriod;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IDashboardService {

    /**
     * Get dashboard overview statistics
     * @return DashboardStatsResponse containing totalUsers, newUsersToday, totalPosts, totalQuestions
     */
    DashboardStatsResponse getStats();

    /**
     * Get user growth data over time
     * @param period DAY, MONTH, or YEAR
     * @return UserGrowthResponse containing growth data points
     */
    UserGrowthResponse getUserGrowth(DashboardPeriod period);

    /**
     * Get comparison of posts vs questions over time
     * @param period DAY, MONTH, or YEAR
     * @return ContentComparisonResponse containing comparison data points
     */
    ContentComparisonResponse getContentComparison(DashboardPeriod period);

    /**
     * Get top 5 most used tags
     * @return List of TopTagResponse
     */
    List<TopTagResponse> getTopTags();

    /**
     * Get paginated list of newest users
     * @param page page number (0-based)
     * @return PageResponse of NewUserResponse
     */
    PageResponse<NewUserResponse> getNewestUsers(int page);
    int broadcastNotification(BroadcastNotificationRequest request);

    /**
     * Get all users with pagination and search functionality
     * @param page page number (0-based)
     * @param size page size
     * @param search search query for email or name
     * @return PageResponse of NewUserResponse
     */
    PageResponse<NewUserResponse> getAllUsers(int page, int size, String search);

    /**
     * Update user account status (ban/active)
     * @param userId the user ID
     * @param request the status update request
     * @return updated user response
     */
    NewUserResponse updateUserStatus(UUID userId, UpdateUserStatusRequest request);

    /**
     * Update user role
     * @param userId the user ID
     * @param request the role update request
     * @return updated user response
     */
    NewUserResponse updateUserRole(UUID userId, UpdateUserRoleRequest request);

    /**
     * Get all notifications with pagination
     * @param page page number (0-based)
     * @param size page size
     * @return PageResponse of NotificationResponse
     */
    PageResponse<NotificationResponse> getAllNotifications(int page, int size);

    /**
     * Send notification to specific users or broadcast to all users
     * @param request the notification request containing content and optional recipient IDs
     * @return number of notifications sent
     */
    int sendNotification(SendNotificationRequest request);

    /**
     * Get all posts with filtering and pagination
     * @param status filter by content status (optional)
     * @param ownerId filter by author/owner ID (optional)
     * @param keyword search keyword in title and body (optional)
     * @param pageable pagination parameters
     * @return PageResponse of PostSummaryResponse
     */
    PageResponse<PostSummaryResponse> getAllPosts(ContentStatus status, UUID ownerId, String keyword, Pageable pageable);

    /**
     * Get all questions with filtering and pagination
     * @param status filter by content status (optional)
     * @param ownerId filter by author/owner ID (optional)
     * @param keyword search keyword in title and body (optional)
     * @param pageable pagination parameters
     * @return PageResponse of QuestionSummaryResponse
     */
    PageResponse<QuestionSummaryResponse> getAllQuestions(ContentStatus status, UUID ownerId, String keyword, Pageable pageable);

    /**
     * Delete multiple posts at once
     * @param postIds list of post IDs to delete
     * @return number of posts successfully deleted
     */
    int deleteMultiplePosts(List<UUID> postIds);

    /**
     * Delete multiple questions at once
     * @param questionIds list of question IDs to delete
     * @return number of questions successfully deleted
     */
    int deleteMultipleQuestions(List<UUID> questionIds);

    /**
     * Update the status of a post (Admin only - bypasses author check)
     * @param postId the post ID
     * @param newStatus the new status to set
     * @return updated PostSummaryResponse
     */
    PostSummaryResponse updatePostStatus(UUID postId, ContentStatus newStatus);

    /**
     * Update the status of a question (Admin only - bypasses author check)
     * @param questionId the question ID
     * @param newStatus the new status to set
     * @return updated QuestionSummaryResponse
     */
    QuestionSummaryResponse updateQuestionStatus(UUID questionId, ContentStatus newStatus);
}
