package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.UpdateTagRequest;
import org.example.learniversebe.dto.request.UpdateUserRoleRequest;
import org.example.learniversebe.dto.request.UpdateUserStatusRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.DashboardPeriod;
import org.example.learniversebe.service.IDashboardService;
import org.example.learniversebe.service.ITagService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
            description = "Updates a user's role (ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR)")
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<NewUserResponse> updateUserRole(
            @Parameter(description = "User ID")
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(dashboardService.updateUserRole(userId, request));
    }
}
