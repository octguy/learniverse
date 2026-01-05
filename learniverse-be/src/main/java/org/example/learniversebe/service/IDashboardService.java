package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.DashboardPeriod;

import java.util.List;

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

    PageResponse<NotificationResponse> getAllNotifications(int page, int size);
}
