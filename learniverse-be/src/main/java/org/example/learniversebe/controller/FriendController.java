package org.example.learniversebe.controller;

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
    @PostMapping("/request/{recipientId}")
    public ResponseEntity<ApiResponse<Friend>> sendFriendRequest(@PathVariable UUID recipientId) {
        Friend friend = friendService.sendFriendRequest(recipientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ApiResponse<>(HttpStatus.CREATED, "Friend request sent successfully.", friend, null)
        );
    }

    // UC5.2: Chấp nhận yêu cầu
    @PostMapping("/accept/{senderId}") // senderId là người đã gửi request cho mình
    public ResponseEntity<ApiResponse<Friend>> acceptFriendRequest(@PathVariable UUID senderId) {
        Friend friend = friendService.acceptFriendRequest(senderId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request accepted.", friend, null)
        );
    }

    // UC5.2: Từ chối yêu cầu
    @DeleteMapping("/decline/{senderId}")
    public ResponseEntity<ApiResponse<Void>> declineFriendRequest(@PathVariable UUID senderId) {
        friendService.declineFriendRequest(senderId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request declined.", null, null)
        );
    }

    // UC5.4: Hủy yêu cầu mình đã gửi
    @DeleteMapping("/cancel/{recipientId}")
    public ResponseEntity<ApiResponse<Void>> cancelFriendRequest(@PathVariable UUID recipientId) {
        friendService.cancelFriendRequest(recipientId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friend request canceled.", null, null)
        );
    }

    // UC5.5: Unfriend
    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> unfriend(@PathVariable UUID friendId) {
        friendService.unfriend(friendId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Unfriended successfully.", null, null)
        );
    }

    // UC5.3: Lấy danh sách bạn bè
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getFriends() {
        List<UserProfileResponse> friends = friendService.getFriends();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Friends list retrieved successfully.", friends, null)
        );
    }

    // Lấy danh sách lời mời kết bạn đang chờ (người khác gửi đến)
    @GetMapping("/requests/received")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getPendingFriendRequests() {
        List<UserProfileResponse> requests = friendService.getPendingFriendRequests();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Pending received requests retrieved.", requests, null)
        );
    }

    // Lấy danh sách lời mời mình đã gửi đi
    @GetMapping("/requests/sent")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getSentFriendRequests() {
        List<UserProfileResponse> requests = friendService.getSentFriendRequests();
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Pending sent requests retrieved.", requests, null)
        );
    }
}