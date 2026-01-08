package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateGroupRequest;
import org.example.learniversebe.dto.request.UpdateGroupRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.GroupPrivacy;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Interface defining business logic operations for Groups/Communities.
 */
public interface IGroupService {

    // ================== CRUD ==================

    /**
     * UC6.1: Creates a new group. The authenticated user becomes the owner.
     */
    GroupResponse createGroup(CreateGroupRequest request, MultipartFile avatar, MultipartFile cover);

    /**
     * UC6.3: Gets detailed group information by slug.
     */
    GroupResponse getGroupBySlug(String slug);

    /**
     * Updates group information. Only owner can update.
     */
    GroupResponse updateGroup(UUID groupId, UpdateGroupRequest request);

    /**
     * UC6.15: Soft-deletes a group. Only owner can delete.
     */
    void deleteGroup(UUID groupId);

    // ================== Discovery ==================

    /**
     * UC6.2: Gets public groups for discovery.
     */
    PageResponse<GroupSummaryResponse> getPublicGroups(String query, GroupPrivacy privacy, Pageable pageable);

    /**
     * UC6.2: Gets groups the current user has joined.
     */
    PageResponse<GroupSummaryResponse> getMyGroups(Pageable pageable);

    // ================== Membership ==================

    /**
     * UC6.4: Join a group. For public groups, joins immediately.
     * For private groups, creates a join request.
     */
    GroupMemberResponse joinGroup(UUID groupId);

    /**
     * UC6.6: Leave a group.
     */
    void leaveGroup(UUID groupId);

    /**
     * UC6.9: Get members of a group.
     */
    PageResponse<GroupMemberResponse> getGroupMembers(UUID groupId, Pageable pageable);

    // ================== Join Requests (Private Groups) ==================

    /**
     * UC6.5: Get pending join requests for a private group.
     */
    PageResponse<GroupJoinRequestResponse> getPendingJoinRequests(UUID groupId, Pageable pageable);

    /**
     * UC6.5: Approve a join request.
     */
    void approveJoinRequest(UUID requestId);

    /**
     * UC6.5: Reject a join request.
     */
    void rejectJoinRequest(UUID requestId);

    // ================== Group Feed ==================

    /**
     * UC6.8: Get posts in a group's feed.
     */
    PageResponse<PostSummaryResponse> getGroupFeed(UUID groupId, Pageable pageable);

    // ================== Moderation (Phase 2) ==================

    /**
     * UC6.10: Kick a member from the group.
     */
    void kickMember(UUID groupId, UUID userId);

    /**
     * UC6.14: Assign moderator role to a member.
     */
    void assignModerator(UUID groupId, UUID userId);

    /**
     * UC6.14: Remove moderator role from a member.
     */
    void removeModerator(UUID groupId, UUID userId);

    /**
     * UC6.11: Transfer ownership to another member.
     */
    void transferOwnership(UUID groupId, UUID newOwnerId);

    /**
     * UC6.12: Pin a post in the group feed.
     */
    void pinPost(UUID groupId, UUID postId);

    /**
     * UC6.12: Unpin a post in the group feed.
     */
    void unpinPost(UUID groupId, UUID postId);
}
