package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.example.learniversebe.dto.response.NotificationResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final INotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get all notification of current user")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "10", required = false) int size) {

        PageResponse<NotificationResponse> notifications = notificationService.getNotifications(page, size);

        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Notifications retrieved successfully", notifications, null)
        );
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count of current user")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount() {
        long count = notificationService.getUnreadNotificationCount();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Unread count retrieved successfully", count, null)
        );
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all notification of current user as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "All notifications marked as read", null, null)
        );
    }

    @PutMapping("/{notificationId}/mark-read")
    @Operation(summary = "Mark notification of notificationId as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable UUID notificationId) {
        NotificationResponse response = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Notification marked as read", response, null)
        );
    }
}