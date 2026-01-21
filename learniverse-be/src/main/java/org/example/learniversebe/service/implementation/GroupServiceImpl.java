package org.example.learniversebe.service.implementation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateGroupRequest;
import org.example.learniversebe.dto.request.UpdateGroupRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.mapper.GroupMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IGroupService;
import org.example.learniversebe.service.IStorageService;
import org.example.learniversebe.util.ServiceHelper;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements IGroupService {

    private static final int MAX_GROUPS_PER_USER = 10;

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupJoinRequestRepository groupJoinRequestRepository;
    private final GroupTagRepository groupTagRepository;
    private final TagRepository tagRepository;
    private final ContentRepository contentRepository;
    private final GroupMapper groupMapper;
    private final ContentMapper contentMapper;
    private final ServiceHelper serviceHelper;
    private final SlugGenerator slugGenerator;
    private final IStorageService storageService;

    // ================== CRUD ==================

    @Override
    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, MultipartFile avatar, MultipartFile cover) {
        User currentUser = serviceHelper.getCurrentUser();
        
        // Check group limit
        long groupCount = groupRepository.countByCreatedById(currentUser.getId());
        if (groupCount >= MAX_GROUPS_PER_USER) {
            throw new BadRequestException("Bạn đã tạo tối đa " + MAX_GROUPS_PER_USER + " nhóm");
        }

        // Generate unique slug
        String baseSlug = slugGenerator.generateSlug(request.getName());
        String slug = baseSlug;
        int counter = 1;
        while (groupRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        // Upload avatar if provided
        String avatarUrl = request.getAvatarUrl();
        if (avatar != null && !avatar.isEmpty()) {
            try {
                Map<String, String> uploadResult = storageService.uploadFile(avatar);
                avatarUrl = uploadResult.get("url");
            } catch (IOException e) {
                log.error("Failed to upload avatar: {}", e.getMessage());
                throw new BadRequestException("Không thể tải lên ảnh đại diện");
            }
        }

        // Upload cover if provided
        String coverUrl = request.getCoverImageUrl();
        if (cover != null && !cover.isEmpty()) {
            try {
                Map<String, String> uploadResult = storageService.uploadFile(cover);
                coverUrl = uploadResult.get("url");
            } catch (IOException e) {
                log.error("Failed to upload cover: {}", e.getMessage());
                throw new BadRequestException("Không thể tải lên ảnh bìa");
            }
        }

        // Create group
        Group group = new Group();
        group.setName(request.getName());
        group.setSlug(slug);
        group.setDescription(request.getDescription());
        group.setAvatarUrl(avatarUrl);
        group.setCoverImageUrl(coverUrl);
        group.setPrivacy(request.getPrivacy() != null ? request.getPrivacy() : GroupPrivacy.PUBLIC);
        group.setCreatedBy(currentUser);
        group.setMemberCount(1);

        Group savedGroup = groupRepository.save(group);

        // Add creator as owner
        GroupMember ownerMember = new GroupMember();
        ownerMember.setGroup(savedGroup);
        ownerMember.setUser(currentUser);
        ownerMember.setRole(GroupMemberRole.OWNER);
        ownerMember.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(ownerMember);

        // Add tags
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            for (UUID tagId : request.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + tagId));
                GroupTag groupTag = new GroupTag();
                groupTag.setGroup(savedGroup);
                groupTag.setTag(tag);
                groupTagRepository.save(groupTag);
            }
        }

        log.info("Group '{}' created by user {} with slug {}", request.getName(), currentUser.getUsername(), slug);

        GroupResponse response = groupMapper.groupToGroupResponse(savedGroup);
        response.setIsMember(true);
        response.setHasPendingRequest(false);
        response.setCurrentUserRole(GroupMemberRole.OWNER);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public GroupResponse getGroupBySlug(String slug) {
        Group group = groupRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại"));

        GroupResponse response = groupMapper.groupToGroupResponse(group);
        setUserSpecificFields(response, group.getId());
        return response;
    }

    @Override
    @Transactional
    public GroupResponse updateGroup(UUID groupId, UpdateGroupRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Group group = findGroupOrFail(groupId);

        // Only owner can update
        ensureUserIsOwner(group.getId(), currentUser.getId());

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getAvatarUrl() != null) {
            group.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getCoverImageUrl() != null) {
            group.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getPrivacy() != null) {
            group.setPrivacy(request.getPrivacy());
        }

        // Update tags
        if (request.getTagIds() != null) {
            groupTagRepository.deleteByGroupId(groupId);
            for (UUID tagId : request.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + tagId));
                GroupTag groupTag = new GroupTag();
                groupTag.setGroup(group);
                groupTag.setTag(tag);
                groupTagRepository.save(groupTag);
            }
        }

        Group updatedGroup = groupRepository.save(group);
        GroupResponse response = groupMapper.groupToGroupResponse(updatedGroup);
        setUserSpecificFields(response, groupId);
        return response;
    }

    @Override
    @Transactional
    public void deleteGroup(UUID groupId) {
        User currentUser = serviceHelper.getCurrentUser();
        Group group = findGroupOrFail(groupId);

        ensureUserIsOwner(group.getId(), currentUser.getId());

        log.info("Deleting group '{}' by owner {}", group.getName(), currentUser.getUsername());

        // Soft delete all related data including posts
        contentRepository.softDeleteByGroupId(groupId);
        groupJoinRequestRepository.deleteAllByGroupId(groupId);
        groupMemberRepository.deleteAllByGroupId(groupId);
        groupTagRepository.deleteByGroupId(groupId);
        groupRepository.delete(group);
    }

    // ================== Discovery ==================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupSummaryResponse> getPublicGroups(String query, GroupPrivacy privacy, Pageable pageable) {
        Page<Group> groupPage;

        if (query != null && !query.isBlank()) {
            groupPage = groupRepository.searchGroups(query, privacy, pageable);
        } else if (privacy != null) {
            groupPage = groupRepository.findByPrivacy(privacy, pageable);
        } else {
            // Show all groups (both public and private) for discovery
            groupPage = groupRepository.findAll(pageable);
        }

        PageResponse<GroupSummaryResponse> response = groupMapper.groupPageToPageResponse(groupPage);
        
        // Set user-specific fields
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && response.getContent() != null) {
            for (GroupSummaryResponse groupSummary : response.getContent()) {
                boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndIsBannedFalse(groupSummary.getId(), currentUserId);
                boolean hasPending = groupJoinRequestRepository.existsByGroupIdAndUserIdAndStatus(
                        groupSummary.getId(), currentUserId, GroupJoinRequestStatus.PENDING);
                groupSummary.setIsMember(isMember);
                groupSummary.setHasPendingRequest(hasPending);
            }
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupSummaryResponse> getMyGroups(Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();

        Page<GroupMember> membershipPage = groupMemberRepository.findByUserId(currentUser.getId(), pageable);

        List<GroupSummaryResponse> groups = membershipPage.getContent().stream()
                .map(gm -> {
                    GroupSummaryResponse summary = groupMapper.groupToGroupSummaryResponse(gm.getGroup());
                    summary.setIsMember(true);
                    summary.setHasPendingRequest(false);
                    return summary;
                })
                .toList();

        return PageResponse.<GroupSummaryResponse>builder()
                .content(groups)
                .currentPage(membershipPage.getNumber())
                .pageSize(membershipPage.getSize())
                .totalElements(membershipPage.getTotalElements())
                .totalPages(membershipPage.getTotalPages())
                .first(membershipPage.isFirst())
                .last(membershipPage.isLast())
                .build();
    }

    // ================== Membership ==================

    @Override
    @Transactional
    public GroupMemberResponse joinGroup(UUID groupId) {
        User currentUser = serviceHelper.getCurrentUser();
        Group group = findGroupOrFail(groupId);

        // Check if already member (including soft-deleted)
        Optional<GroupMember> existingMember = groupMemberRepository.findByGroupIdAndUserIdIncludeDeleted(groupId, currentUser.getId());
        
        if (existingMember.isPresent()) {
            GroupMember member = existingMember.get();
            
            // If banned, cannot rejoin
            if (member.getIsBanned()) {
                throw new BadRequestException("Bạn đã bị cấm tham gia nhóm này");
            }
            
            // If soft-deleted (left the group before), restore membership
            if (member.getDeletedAt() != null) {
                member.setDeletedAt(null);
                member.setJoinedAt(LocalDateTime.now());
                member.setRole(GroupMemberRole.MEMBER);
                GroupMember savedMember = groupMemberRepository.save(member);
                
                // Update member count
                group.setMemberCount(group.getMemberCount() + 1);
                groupRepository.save(group);
                
                log.info("User {} rejoined group '{}' (restored from soft-delete)", currentUser.getUsername(), group.getName());
                return groupMapper.groupMemberToGroupMemberResponse(savedMember);
            }
            
            // Already active member
            throw new BadRequestException("Bạn đã là thành viên của nhóm này");
        }

        // Check if has pending request
        if (groupJoinRequestRepository.existsByGroupIdAndUserIdAndStatus(groupId, currentUser.getId(), GroupJoinRequestStatus.PENDING)) {
            throw new BadRequestException("Bạn đã gửi yêu cầu tham gia, vui lòng đợi duyệt");
        }

        if (group.getPrivacy() == GroupPrivacy.PUBLIC) {
            // Join immediately
            GroupMember member = new GroupMember();
            member.setGroup(group);
            member.setUser(currentUser);
            member.setRole(GroupMemberRole.MEMBER);
            member.setJoinedAt(LocalDateTime.now());
            GroupMember savedMember = groupMemberRepository.save(member);

            // Update member count
            group.setMemberCount(group.getMemberCount() + 1);
            groupRepository.save(group);

            log.info("User {} joined public group '{}'", currentUser.getUsername(), group.getName());
            return groupMapper.groupMemberToGroupMemberResponse(savedMember);
        } else {
            // Create join request for private group
            GroupJoinRequest request = new GroupJoinRequest();
            request.setGroup(group);
            request.setUser(currentUser);
            request.setStatus(GroupJoinRequestStatus.PENDING);
            groupJoinRequestRepository.save(request);

            log.info("User {} requested to join private group '{}'", currentUser.getUsername(), group.getName());

            // TODO: Send notification to owner/mods

            // Return a placeholder response indicating pending
            return GroupMemberResponse.builder()
                    .userId(currentUser.getId())
                    .username(currentUser.getUsername())
                    .role(null) // Pending
                    .build();
        }
    }

    @Override
    @Transactional
    public void leaveGroup(UUID groupId) {
        User currentUser = serviceHelper.getCurrentUser();
        
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Bạn không phải là thành viên của nhóm này"));

        // Owner cannot leave without transferring ownership
        if (member.getRole() == GroupMemberRole.OWNER) {
            long memberCount = groupMemberRepository.countByGroupIdAndIsBannedFalse(groupId);
            if (memberCount > 1) {
                throw new BadRequestException("Bạn phải chuyển quyền sở hữu cho thành viên khác trước khi rời nhóm");
            }
            // If only owner left, delete the group
            deleteGroup(groupId);
            return;
        }

        groupMemberRepository.delete(member);

        // Update member count
        Group group = findGroupOrFail(groupId);
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        groupRepository.save(group);

        log.info("User {} left group '{}'", currentUser.getUsername(), group.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupMemberResponse> getGroupMembers(UUID groupId, Pageable pageable) {
        findGroupOrFail(groupId);
        Page<GroupMember> memberPage = groupMemberRepository.findActiveByGroupId(groupId, pageable);
        return groupMapper.memberPageToPageResponse(memberPage);
    }

    // ================== Join Requests ==================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupJoinRequestResponse> getPendingJoinRequests(UUID groupId, Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();
        Group group = findGroupOrFail(groupId);

        ensureUserIsOwnerOrModerator(groupId, currentUser.getId());

        Page<GroupJoinRequest> requestPage = groupJoinRequestRepository.findByGroupIdAndStatus(
                groupId, GroupJoinRequestStatus.PENDING, pageable);

        List<GroupJoinRequestResponse> content = requestPage.getContent().stream()
                .map(groupMapper::groupJoinRequestToResponse)
                .toList();

        return PageResponse.<GroupJoinRequestResponse>builder()
                .content(content)
                .currentPage(requestPage.getNumber())
                .pageSize(requestPage.getSize())
                .totalElements(requestPage.getTotalElements())
                .totalPages(requestPage.getTotalPages())
                .first(requestPage.isFirst())
                .last(requestPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void approveJoinRequest(UUID requestId) {
        User currentUser = serviceHelper.getCurrentUser();
        
        GroupJoinRequest request = groupJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu không tồn tại"));

        ensureUserIsOwnerOrModerator(request.getGroup().getId(), currentUser.getId());

        if (request.getStatus() != GroupJoinRequestStatus.PENDING) {
            throw new BadRequestException("Yêu cầu đã được xử lý");
        }

        // Update request
        request.setStatus(GroupJoinRequestStatus.APPROVED);
        request.setProcessedBy(currentUser);
        request.setProcessedAt(LocalDateTime.now());
        groupJoinRequestRepository.save(request);

        // Add member
        GroupMember member = new GroupMember();
        member.setGroup(request.getGroup());
        member.setUser(request.getUser());
        member.setRole(GroupMemberRole.MEMBER);
        member.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(member);

        // Update member count
        Group group = request.getGroup();
        group.setMemberCount(group.getMemberCount() + 1);
        groupRepository.save(group);

        log.info("Join request from {} approved for group '{}' by {}", 
                request.getUser().getUsername(), group.getName(), currentUser.getUsername());
    }

    @Override
    @Transactional
    public void rejectJoinRequest(UUID requestId) {
        User currentUser = serviceHelper.getCurrentUser();
        
        GroupJoinRequest request = groupJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu không tồn tại"));

        ensureUserIsOwnerOrModerator(request.getGroup().getId(), currentUser.getId());

        if (request.getStatus() != GroupJoinRequestStatus.PENDING) {
            throw new BadRequestException("Yêu cầu đã được xử lý");
        }

        request.setStatus(GroupJoinRequestStatus.REJECTED);
        request.setProcessedBy(currentUser);
        request.setProcessedAt(LocalDateTime.now());
        groupJoinRequestRepository.save(request);

        log.info("Join request from {} rejected for group '{}' by {}", 
                request.getUser().getUsername(), request.getGroup().getName(), currentUser.getUsername());
    }

    // ================== Group Feed ==================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getGroupFeed(UUID groupId, Pageable pageable) {
        Group group = findGroupOrFail(groupId);
        UUID currentUserId = serviceHelper.getCurrentUserId();

        // Check access for private groups
        if (group.getPrivacy() == GroupPrivacy.PRIVATE && currentUserId != null) {
            boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndIsBannedFalse(groupId, currentUserId);
            if (!isMember) {
                throw new UnauthorizedException("Bạn không có quyền xem nội dung nhóm này");
            }
        }

        Page<Content> postPage = contentRepository.findByGroupIdAndStatusOrderByIsPinnedDescPublishedAtDesc(
                groupId, ContentStatus.PUBLISHED, pageable);

        return contentMapper.contentPageToPostSummaryPage(postPage);
    }

    // ================== Moderation ==================

    @Override
    @Transactional
    public void kickMember(UUID groupId, UUID userId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwnerOrModerator(groupId, currentUser.getId());

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại"));

        // Cannot kick owner
        if (targetMember.getRole() == GroupMemberRole.OWNER) {
            throw new BadRequestException("Không thể đuổi chủ sở hữu nhóm");
        }

        // Moderators can only kick members, not other moderators
        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId()).orElse(null);
        if (currentMember != null && currentMember.getRole() == GroupMemberRole.MODERATOR 
                && targetMember.getRole() == GroupMemberRole.MODERATOR) {
            throw new BadRequestException("Điều hành viên không thể đuổi điều hành viên khác");
        }

        targetMember.setIsBanned(true);
        groupMemberRepository.save(targetMember);

        Group group = findGroupOrFail(groupId);
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        groupRepository.save(group);

        log.info("User {} was kicked from group '{}' by {}", targetMember.getUser().getUsername(), group.getName(), currentUser.getUsername());
    }

    @Override
    @Transactional
    public void assignModerator(UUID groupId, UUID userId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwner(groupId, currentUser.getId());

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại"));

        if (member.getRole() != GroupMemberRole.MEMBER) {
            throw new BadRequestException("Chỉ có thể bổ nhiệm thành viên làm điều hành viên");
        }

        member.setRole(GroupMemberRole.MODERATOR);
        groupMemberRepository.save(member);

        log.info("User {} was assigned as moderator in group by {}", member.getUser().getUsername(), currentUser.getUsername());
    }

    @Override
    @Transactional
    public void removeModerator(UUID groupId, UUID userId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwner(groupId, currentUser.getId());

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại"));

        if (member.getRole() != GroupMemberRole.MODERATOR) {
            throw new BadRequestException("Người này không phải điều hành viên");
        }

        member.setRole(GroupMemberRole.MEMBER);
        groupMemberRepository.save(member);

        log.info("Moderator role removed from user {} by {}", member.getUser().getUsername(), currentUser.getUsername());
    }

    @Override
    @Transactional
    public void transferOwnership(UUID groupId, UUID newOwnerId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwner(groupId, currentUser.getId());

        GroupMember currentOwner = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Lỗi không xác định"));

        GroupMember newOwner = groupMemberRepository.findByGroupIdAndUserId(groupId, newOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại"));

        currentOwner.setRole(GroupMemberRole.MODERATOR);
        newOwner.setRole(GroupMemberRole.OWNER);

        groupMemberRepository.save(currentOwner);
        groupMemberRepository.save(newOwner);

        log.info("Ownership of group transferred from {} to {}", currentUser.getUsername(), newOwner.getUser().getUsername());
    }

    @Override
    @Transactional
    public void pinPost(UUID groupId, UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwnerOrModerator(groupId, currentUser.getId());

        Content post = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));

        if (post.getGroup() == null || !post.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Bài viết không thuộc nhóm này");
        }

        post.setIsPinned(true);
        contentRepository.save(post);

        log.info("Post {} pinned in group by {}", postId, currentUser.getUsername());
    }

    @Override
    @Transactional
    public void unpinPost(UUID groupId, UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();
        ensureUserIsOwnerOrModerator(groupId, currentUser.getId());

        Content post = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));

        if (post.getGroup() == null || !post.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Bài viết không thuộc nhóm này");
        }

        post.setIsPinned(false);
        contentRepository.save(post);

        log.info("Post {} unpinned in group by {}", postId, currentUser.getUsername());
    }

    // ================== Helper Methods ==================

    private Group findGroupOrFail(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại"));
    }

    private void ensureUserIsOwner(UUID groupId, UUID userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new UnauthorizedException("Bạn không phải thành viên của nhóm này"));
        if (member.getRole() != GroupMemberRole.OWNER) {
            throw new UnauthorizedException("Chỉ chủ sở hữu mới có quyền thực hiện hành động này");
        }
    }

    private void ensureUserIsOwnerOrModerator(UUID groupId, UUID userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new UnauthorizedException("Bạn không phải thành viên của nhóm này"));
        if (member.getRole() != GroupMemberRole.OWNER && member.getRole() != GroupMemberRole.MODERATOR) {
            throw new UnauthorizedException("Bạn không có quyền thực hiện hành động này");
        }
    }

    private void setUserSpecificFields(GroupResponse response, UUID groupId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            Optional<GroupMember> membership = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId);
            response.setIsMember(membership.isPresent() && !membership.get().getIsBanned());
            response.setCurrentUserRole(membership.map(GroupMember::getRole).orElse(null));
            
            boolean hasPending = groupJoinRequestRepository.existsByGroupIdAndUserIdAndStatus(
                    groupId, currentUserId, GroupJoinRequestStatus.PENDING);
            response.setHasPendingRequest(hasPending);
        } else {
            response.setIsMember(false);
            response.setHasPendingRequest(false);
            response.setCurrentUserRole(null);
        }
    }
}
