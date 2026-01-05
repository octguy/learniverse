package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.BroadcastNotificationRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.DashboardPeriod;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IDashboardService;
import org.example.learniversebe.service.INotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Admin dashboard endpoints for statistics and analytics")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final IDashboardService dashboardService;

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

    @Operation(summary = "Get all notifications",
            description = "Returns paginated list of all notifications in the system (admin only)")
    @GetMapping("/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> getAllNotifications(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dashboardService.getAllNotifications(page, size));
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
}
