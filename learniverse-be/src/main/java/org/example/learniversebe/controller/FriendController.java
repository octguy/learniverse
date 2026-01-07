package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.model.Friend;
import org.example.learniversebe.service.IFriendService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/friends")
public class FriendController {

    private final IFriendService friendService;

    // UC5.1: Gửi yêu cầu
    @Operation(summary = "Send friend request")
    @PostMapping("/request/{recipientId}")
    public ResponseEntity<ApiResponse<Friend>> sendFriendRequest(@PathVariable UUID recipientId) {
        Friend friend = friendService.sendFriendRequest(recipientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ApiResponse<>(HttpStatus.CREATED, "Friend request sent successfully.", friend, null)
        );
    }

    // UC5.2: Chấp nhận yêu cầu
    @Operation(summary = "Accept friend request")
    @PostMapping("/accept/{senderId}") // senderId là người đã gửi request cho mình
    public ResponseEntity<ApiResponse<Friend>> acceptFriendRequest(@PathVariable UUID senderId) {
        Friend friend = friendService.acceptFriendRequest(senderId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request accepted.", friend, null)
        );
    }

    // UC5.2: Từ chối yêu cầu
    @Operation(summary = "Decline friend request")
    @DeleteMapping("/decline/{senderId}")
    public ResponseEntity<ApiResponse<Void>> declineFriendRequest(@PathVariable UUID senderId) {
        friendService.declineFriendRequest(senderId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request declined.", null, null)
        );
    }

    // UC5.4: Hủy yêu cầu mình đã gửi
    @Operation(summary = "Cancel sent friend request")
    @DeleteMapping("/cancel/{recipientId}")
    public ResponseEntity<ApiResponse<Void>> cancelFriendRequest(@PathVariable UUID recipientId) {
        friendService.cancelFriendRequest(recipientId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request canceled.", null, null)
        );
    }

    // UC5.5: Unfriend
    @Operation(summary = "Unfriend")
    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> unfriend(@PathVariable UUID friendId) {
        friendService.unfriend(friendId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Unfriended successfully.", null, null)
        );
    }

    // UC5.3: Lấy danh sách bạn bè
    @Operation(summary = "Get friend list")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getFriends() {
        List<UserProfileResponse> friends = friendService.getFriends();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friends list retrieved successfully.", friends, null)
        );
    }

    // Lấy danh sách lời mời kết bạn đang chờ (người khác gửi đến)
    @Operation(summary = "Get pending friend request (from other users)")
    @GetMapping("/requests/received")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getPendingFriendRequests() {
        List<UserProfileResponse> requests = friendService.getPendingFriendRequests();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Pending received requests retrieved.", requests, null)
        );
    }

    // Lấy danh sách lời mời mình đã gửi đi
    @Operation(summary = "Get sent friend request")
    @GetMapping("/requests/sent")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getSentFriendRequests() {
        List<UserProfileResponse> requests = friendService.getSentFriendRequests();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Pending sent requests retrieved.", requests, null)
        );
    }

    @Operation(summary = "Get friend suggestions")
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getSuggestedFriends(
            @RequestParam(defaultValue = "10") int limit
    ) {
        // Giới hạn tối đa 50 suggestions
        if (limit > 50) {
            limit = 50;
        }

        List<UserProfileResponse> suggestions = friendService.getSuggestedFriends(limit);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend suggestions retrieved successfully.", suggestions, null)
        );
    }

    @Operation(summary = "Search friend by display name")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> searchFriends(
            @RequestParam String keyword) {

        List<UserProfileResponse> result = friendService.searchFriends(keyword);

        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend search successfully.", result, null)
        );
    }

    @Operation(summary = "Get friend list of user by userId")
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getOtherUserFriends(
            @PathVariable UUID userId
    ){
        List<UserProfileResponse> responses = friendService.getOtherUserFriends(userId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friends list retrieved successfully. User ID: " + userId, responses, null)
        );
    }
}