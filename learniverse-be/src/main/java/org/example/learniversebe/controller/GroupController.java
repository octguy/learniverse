package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.request.CreateGroupRequest;
import org.example.learniversebe.dto.request.UpdateGroupRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.GroupPrivacy;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IGroupService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Tag(name = "Group Management", description = "APIs for managing Groups/Communities (UC 6)")
public class GroupController {

    private final IGroupService groupService;

    // ================== CRUD ==================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a new group", description = "UC6.1: Creates a new group. The authenticated user becomes the owner.")
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @Valid @ModelAttribute CreateGroupRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            @RequestPart(value = "cover", required = false) MultipartFile cover) {
        GroupResponse response = groupService.createGroup(request, avatar, cover);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Tạo nhóm thành công", response, null));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get group by slug", description = "UC6.3: Gets detailed group information by slug.")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupBySlug(@PathVariable String slug) {
        GroupResponse response = groupService.getGroupBySlug(slug);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    @PutMapping("/{groupId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update a group", description = "Updates group information. Only owner can update.")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable UUID groupId,
            @Valid @RequestBody UpdateGroupRequest request) {
        GroupResponse response = groupService.updateGroup(groupId, request);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Cập nhật nhóm thành công", response, null));
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Delete a group", description = "UC6.15: Soft-deletes a group. Only owner can delete.")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable UUID groupId) {
        groupService.deleteGroup(groupId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Xóa nhóm thành công", null, null));
    }

    // ================== Discovery ==================

    @GetMapping
    @Operation(summary = "Browse groups", description = "UC6.2: Gets public groups for discovery with optional search.")
    public ResponseEntity<ApiResponse<PageResponse<GroupSummaryResponse>>> getPublicGroups(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) GroupPrivacy privacy,
            @ParameterObject @PageableDefault(sort = "memberCount", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<GroupSummaryResponse> response = groupService.getPublicGroups(query, privacy, pageable);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get my groups", description = "UC6.2: Gets groups the current user has joined.")
    public ResponseEntity<ApiResponse<PageResponse<GroupSummaryResponse>>> getMyGroups(
            @ParameterObject @PageableDefault(sort = "joinedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<GroupSummaryResponse> response = groupService.getMyGroups(pageable);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    // ================== Membership ==================

    @PostMapping("/{groupId}/join")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Join a group", description = "UC6.4: Join a group. For public groups, joins immediately. For private groups, creates a join request.")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> joinGroup(@PathVariable UUID groupId) {
        GroupMemberResponse response = groupService.joinGroup(groupId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Tham gia nhóm thành công", response, null));
    }

    @DeleteMapping("/{groupId}/leave")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Leave a group", description = "UC6.6: Leave a group.")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(@PathVariable UUID groupId) {
        groupService.leaveGroup(groupId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã rời khỏi nhóm", null, null));
    }

    @GetMapping("/{groupId}/members")
    @Operation(summary = "Get group members", description = "UC6.9: Get members of a group.")
    public ResponseEntity<ApiResponse<PageResponse<GroupMemberResponse>>> getGroupMembers(
            @PathVariable UUID groupId,
            @ParameterObject @PageableDefault(sort = "joinedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<GroupMemberResponse> response = groupService.getGroupMembers(groupId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    // ================== Join Requests ==================

    @GetMapping("/{groupId}/requests")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get pending join requests", description = "UC6.5: Get pending join requests for a private group.")
    public ResponseEntity<ApiResponse<PageResponse<GroupJoinRequestResponse>>> getPendingJoinRequests(
            @PathVariable UUID groupId,
            @ParameterObject @PageableDefault Pageable pageable) {
        PageResponse<GroupJoinRequestResponse> response = groupService.getPendingJoinRequests(groupId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    @PostMapping("/{groupId}/requests/{requestId}/approve")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Approve join request", description = "UC6.5: Approve a join request.")
    public ResponseEntity<ApiResponse<Void>> approveJoinRequest(
            @PathVariable UUID groupId,
            @PathVariable UUID requestId) {
        groupService.approveJoinRequest(requestId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã chấp nhận yêu cầu tham gia", null, null));
    }

    @PostMapping("/{groupId}/requests/{requestId}/reject")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Reject join request", description = "UC6.5: Reject a join request.")
    public ResponseEntity<ApiResponse<Void>> rejectJoinRequest(
            @PathVariable UUID groupId,
            @PathVariable UUID requestId) {
        groupService.rejectJoinRequest(requestId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã từ chối yêu cầu tham gia", null, null));
    }

    // ================== Group Feed ==================

    @GetMapping("/{groupId}/feed")
    @Operation(summary = "Get group feed", description = "UC6.8: Get posts in a group's feed.")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getGroupFeed(
            @PathVariable UUID groupId,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostSummaryResponse> response = groupService.getGroupFeed(groupId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Success", response, null));
    }

    // ================== Moderation ==================

    @PostMapping("/{groupId}/members/{userId}/kick")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Kick a member", description = "UC6.10: Kick a member from the group.")
    public ResponseEntity<ApiResponse<Void>> kickMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId) {
        groupService.kickMember(groupId, userId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã đuổi thành viên khỏi nhóm", null, null));
    }

    @PostMapping("/{groupId}/members/{userId}/moderator")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Assign moderator role", description = "UC6.14: Assign moderator role to a member.")
    public ResponseEntity<ApiResponse<Void>> assignModerator(
            @PathVariable UUID groupId,
            @PathVariable UUID userId) {
        groupService.assignModerator(groupId, userId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã bổ nhiệm điều hành viên", null, null));
    }

    @DeleteMapping("/{groupId}/members/{userId}/moderator")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Remove moderator role", description = "UC6.14: Remove moderator role from a member.")
    public ResponseEntity<ApiResponse<Void>> removeModerator(
            @PathVariable UUID groupId,
            @PathVariable UUID userId) {
        groupService.removeModerator(groupId, userId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã gỡ quyền điều hành viên", null, null));
    }

    @PostMapping("/{groupId}/transfer-ownership/{newOwnerId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Transfer ownership", description = "UC6.11: Transfer ownership to another member.")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID groupId,
            @PathVariable UUID newOwnerId) {
        groupService.transferOwnership(groupId, newOwnerId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã chuyển quyền sở hữu", null, null));
    }

    @PostMapping("/{groupId}/posts/{postId}/pin")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Pin a post", description = "UC6.12: Pin a post in the group feed.")
    public ResponseEntity<ApiResponse<Void>> pinPost(
            @PathVariable UUID groupId,
            @PathVariable UUID postId) {
        groupService.pinPost(groupId, postId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã ghim bài viết", null, null));
    }

    @DeleteMapping("/{groupId}/posts/{postId}/pin")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Unpin a post", description = "UC6.12: Unpin a post in the group feed.")
    public ResponseEntity<ApiResponse<Void>> unpinPost(
            @PathVariable UUID groupId,
            @PathVariable UUID postId) {
        groupService.unpinPost(groupId, postId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Đã bỏ ghim bài viết", null, null));
    }
}
