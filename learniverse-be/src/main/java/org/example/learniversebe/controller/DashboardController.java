package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.request.SendNotificationRequest;
import org.example.learniversebe.dto.request.UpdateStatusRequest;
import org.example.learniversebe.dto.request.UpdateTagRequest;
import org.example.learniversebe.dto.request.UpdateUserRoleRequest;
import org.example.learniversebe.dto.request.UpdateUserStatusRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.DashboardPeriod;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IDashboardService;
import org.example.learniversebe.service.INotificationService;
import org.springframework.http.HttpStatus;
import org.example.learniversebe.service.INotificationService;
import org.springframework.http.HttpStatus;
import org.example.learniversebe.service.ITagService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Admin dashboard endpoints for statistics and analytics")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final IDashboardService dashboardService;
    private final ITagService tagService;

    @Operation(summary = "Get dashboard statistics overview",
            description = "Returns totalUsers, newUsersToday, totalPosts, totalQuestions")
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @Operation(summary = "Get user growth data",
            description = "Returns user registration growth data filtered by period (DAY, MONTH, YEAR)")
    @GetMapping("/user-growth")
    public ResponseEntity<UserGrowthResponse> getUserGrowth(
            @Parameter(description = "Period to filter by: DAY (last 30 days), MONTH (last 12 months), YEAR (last 5 years)")
            @RequestParam(defaultValue = "DAY") DashboardPeriod period) {
        return ResponseEntity.ok(dashboardService.getUserGrowth(period));
    }

    @Operation(summary = "Get posts vs questions comparison",
            description = "Returns comparison of posts and questions count filtered by period (DAY, MONTH, YEAR)")
    @GetMapping("/content-comparison")
    public ResponseEntity<ContentComparisonResponse> getContentComparison(
            @Parameter(description = "Period to filter by: DAY (last 30 days), MONTH (last 12 months), YEAR (last 5 years)")
            @RequestParam(defaultValue = "DAY") DashboardPeriod period) {
        return ResponseEntity.ok(dashboardService.getContentComparison(period));
    }

    @Operation(summary = "Get top 5 most used tags",
            description = "Returns the top 5 tags with the highest usage count across all content")
    @GetMapping("/top-tags")
    public ResponseEntity<List<TopTagResponse>> getTopTags() {
        return ResponseEntity.ok(dashboardService.getTopTags());
    }

    @Operation(summary = "Get newest users",
            description = "Returns paginated list of newest users (page size 20) with id, username, email, created_at, and status")
    @GetMapping("/newest-users")
    public ResponseEntity<PageResponse<NewUserResponse>> getNewestUsers(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(dashboardService.getNewestUsers(page));
    }

    @Operation(summary = "Send notification to all users",
            description = "Broadcasts a notification to all users in the system (admin only)")
    @PostMapping("/notifications/broadcast")
    public ResponseEntity<ApiResponse<String>> broadcastNotification(
            @RequestBody @Valid BroadcastNotificationRequest request) {
        int sentCount = dashboardService.broadcastNotification(request);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        HttpStatus.OK,
                        "Notification sent to " + sentCount + " users",
                        "Broadcast successful",
                        null
                )
        );
    }

    // ==================== Tag Management ====================

    @Operation(summary = "Update a tag",
            description = "Updates an existing tag's name and/or description")
    @PutMapping("/tags/{tagId}")
    public ResponseEntity<TagResponse> updateTag(
            @Parameter(description = "Tag ID")
            @PathVariable UUID tagId,
            @Valid @RequestBody UpdateTagRequest request) {
        return ResponseEntity.ok(tagService.updateTag(tagId, request));
    }

    @Operation(summary = "Delete a tag",
            description = "Soft deletes a tag by ID")
    @DeleteMapping("/tags/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @Parameter(description = "Tag ID")
            @PathVariable UUID tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.noContent().build();
    }

    // ==================== User Management ====================

    @Operation(summary = "Get all users with pagination and search",
            description = "Returns paginated list of all users, with optional search by email or username")
    @GetMapping("/users")
    public ResponseEntity<PageResponse<NewUserResponse>> getAllUsers(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search query for email or username")
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(dashboardService.getAllUsers(page, size, search));
    }

    @Operation(summary = "Update user account status",
            description = "Updates a user's account status (ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION)")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<NewUserResponse> updateUserStatus(
            @Parameter(description = "User ID")
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(dashboardService.updateUserStatus(userId, request));
    }

    @Operation(summary = "Update user role",
            description = "Updates a user's role (ROLE_USER, ROLE_ADMIN)")
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<NewUserResponse> updateUserRole(
            @Parameter(description = "User ID")
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(dashboardService.updateUserRole(userId, request));
    }

    // ==================== Notification Management ====================


    @Operation(summary = "Send notification",
            description = "Send notification to specific users or broadcast to all users. If recipientIds is null or empty, notification will be broadcast to all users.")
    @PostMapping("/notifications")
    public ResponseEntity<Map<String, Object>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        int sentCount = dashboardService.sendNotification(request);
        return ResponseEntity.ok(Map.of(
                "message", "Notifications sent successfully",
                "sentCount", sentCount
        ));
    }

    @Operation(summary = "Get all notifications",
            description = "Returns paginated list of all notifications in the system")
    @GetMapping("/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> getAllNotifications(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dashboardService.getAllNotifications(page, size));
    }

    // ==================== Content Management ====================

    @Operation(summary = "Get all posts with filtering",
            description = "Returns paginated list of all posts with optional filtering by status, owner, and keyword search")
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getAllPosts(
            @Parameter(description = "Filter by content status (DRAFT, PUBLISHED, ARCHIVED, DELETED)")
            @RequestParam(required = false) ContentStatus status,
            @Parameter(description = "Filter by author/owner ID")
            @RequestParam(required = false) UUID ownerId,
            @Parameter(description = "Search keyword in title and body")
            @RequestParam(required = false) String keyword,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostSummaryResponse> posts = dashboardService.getAllPosts(status, ownerId, keyword, pageable);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Posts retrieved successfully",
                posts,
                null
        ));
    }

    @Operation(summary = "Get all questions with filtering",
            description = "Returns paginated list of all questions with optional filtering by status, owner, and keyword search")
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> getAllQuestions(
            @Parameter(description = "Filter by content status (DRAFT, PUBLISHED, ARCHIVED, DELETED)")
            @RequestParam(required = false) ContentStatus status,
            @Parameter(description = "Filter by author/owner ID")
            @RequestParam(required = false) UUID ownerId,
            @Parameter(description = "Search keyword in title and body")
            @RequestParam(required = false) String keyword,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<QuestionSummaryResponse> questions = dashboardService.getAllQuestions(status, ownerId, keyword, pageable);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Questions retrieved successfully",
                questions,
                null
        ));
    }

    @Operation(summary = "Delete multiple posts",
            description = "Deletes multiple posts at once by their IDs (soft delete)")
    @DeleteMapping("/posts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteMultiplePosts(
            @Parameter(description = "List of post IDs to delete")
            @RequestBody List<UUID> postIds) {
        int deletedCount = dashboardService.deleteMultiplePosts(postIds);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Posts deleted successfully",
                Map.of(
                        "requestedCount", postIds.size(),
                        "deletedCount", deletedCount
                ),
                null
        ));
    }

    @Operation(summary = "Delete multiple questions",
            description = "Deletes multiple questions at once by their IDs (soft delete)")
    @DeleteMapping("/questions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteMultipleQuestions(
            @Parameter(description = "List of question IDs to delete")
            @RequestBody List<UUID> questionIds) {
        int deletedCount = dashboardService.deleteMultipleQuestions(questionIds);
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Questions deleted successfully",
                Map.of(
                        "requestedCount", questionIds.size(),
                        "deletedCount", deletedCount
                ),
                null
        ));
    }

    @Operation(summary = "Update post status",
            description = "Updates the status of a post (Admin only - DRAFT, PUBLISHED, ARCHIVED, DELETED)")
    @PatchMapping("/posts/{postId}/status")
    public ResponseEntity<ApiResponse<PostSummaryResponse>> updatePostStatus(
            @Parameter(description = "Post ID")
            @PathVariable UUID postId,
            @Valid @RequestBody UpdateStatusRequest request) {
        PostSummaryResponse post = dashboardService.updatePostStatus(postId, request.getStatus());
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Post status updated successfully",
                post,
                null
        ));
    }

    @Operation(summary = "Update question status",
            description = "Updates the status of a question (Admin only - DRAFT, PUBLISHED, ARCHIVED, DELETED)")
    @PatchMapping("/questions/{questionId}/status")
    public ResponseEntity<ApiResponse<QuestionSummaryResponse>> updateQuestionStatus(
            @Parameter(description = "Question ID")
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateStatusRequest request) {
        QuestionSummaryResponse question = dashboardService.updateQuestionStatus(questionId, request.getStatus());
        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK,
                "Question status updated successfully",
                question,
                null
        ));
    }


}
