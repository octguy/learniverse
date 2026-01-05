package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.UpdateUserRoleRequest;
import org.example.learniversebe.dto.request.UpdateUserStatusRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.DashboardPeriod;

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
}
