package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.UpdatePostRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.example.learniversebe.dto.response.VisibilityInfoResponse;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.ContentVisibilityService;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.service.IPostService;
import org.example.learniversebe.service.IStorageService;
import org.example.learniversebe.util.ServiceHelper;
import org.example.learniversebe.util.SlugGenerator;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PostServiceImpl implements IPostService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final ContentTagRepository contentTagRepository;
    private final ContentEditHistoryRepository editHistoryRepository;
    private final ContentMapper contentMapper;
    private final ServiceHelper serviceHelper;
    private final SlugGenerator slugGenerator;
    private final IInteractionService interactionService;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ShareRepository shareRepository;
    private final IStorageService storageService;
    private final AttachmentRepository attachmentRepository;
    private final GroupRepository groupRepository;
    private final ContentVisibilityService visibilityService;
    private final FriendRepository friendRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Value("${app.content.edit.limit-hours:24}") // Lấy từ application.properties, mặc định 24h
    private long editLimitHours;


    // Constructor Injection
    public PostServiceImpl(ContentRepository contentRepository,
                           UserRepository userRepository,
                           TagRepository tagRepository,
                           ContentTagRepository contentTagRepository,
                           ContentEditHistoryRepository editHistoryRepository, // Inject
                           ContentMapper contentMapper,
                           ServiceHelper serviceHelper, // Inject
                           SlugGenerator slugGenerator, // Inject
                           IInteractionService interactionService,
                           CommentRepository commentRepository,
                           ReactionRepository reactionRepository,
                           BookmarkRepository bookmarkRepository,
                           ShareRepository shareRepository,
                           IStorageService storageService,
                           AttachmentRepository attachmentRepository,
                           GroupRepository groupRepository,
                           ContentVisibilityService visibilityService,
                           FriendRepository friendRepository,
                           GroupMemberRepository groupMemberRepository
    ) {
        this.contentRepository = contentRepository;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.contentTagRepository = contentTagRepository;
        this.editHistoryRepository = editHistoryRepository;
        this.contentMapper = contentMapper;
        this.serviceHelper = serviceHelper;
        this.slugGenerator = slugGenerator;
        this.interactionService = interactionService;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.shareRepository = shareRepository;
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
        this.groupRepository = groupRepository;
        this.visibilityService = visibilityService;
        this.friendRepository = friendRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request, List<MultipartFile> files) {
        log.info("Creating new post with title: {}", request.getTitle());
        User author = serviceHelper.getCurrentUser();

        if (request.getGroupId() != null) {
            visibilityService.validateVisibilityForGroupPost(request.getGroupId(), request.getVisibility());
        }

        // Map DTO sang Entity
        Content content = contentMapper.createPostRequestToContent(request);
        content.setAuthor(author);
        content.setContentType(ContentType.POST);
        content.setStatus(request.getStatus() != null ? request.getStatus() : ContentStatus.PUBLISHED);
        if (request.getGroupId() != null) {
            content.setVisibility(ContentVisibility.GROUP);
        } else if (request.getVisibility() != null) {
            content.setVisibility(request.getVisibility());
        } else {
            content.setVisibility(ContentVisibility.PUBLIC);
        }
        if (content.getStatus() == ContentStatus.PUBLISHED) {
            content.setPublishedAt(LocalDateTime.now());
        }
        content.setSlug(slugGenerator.generateSlug(request.getTitle() != null ? request.getTitle() : request.getBody().substring(0, Math.min(request.getBody().length(), 50)))); // Tạo slug

        // Bind group if posting in a group
        if (request.getGroupId() != null) {
            Group group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));

            // Check if user is member of group
            UUID currentUserId = author.getId();
            if (!groupMemberRepository.isUserMemberOfGroup(currentUserId, request.getGroupId())) {
                throw new UnauthorizedException("You must be a member of the group to post");
            }

            content.setGroup(group);
        }

        associateTags(content, request.getTagIds());

        Content savedContent = contentRepository.save(content);

        if (files != null && !files.isEmpty()) {
            List<Attachment> attachments = new ArrayList<>();
            for (MultipartFile file : files) {
                try {
                    Map<String, String> uploadResult = storageService.uploadFile(file);

                    Attachment attachment = new Attachment();
                    attachment.setContent(savedContent);
                    attachment.setUploadedBy(author);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setMimeType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    attachment.setStorageUrl(uploadResult.get("url"));
                    attachment.setStorageKey(uploadResult.get("key"));

                    attachment.setFileType(determineAttachmentType(Objects.requireNonNull(file.getContentType())));
                    attachment.setIsVerified(true);

                    attachments.add(attachment);
                } catch (IOException e) {
                    throw new BadRequestException("Failed to upload file: " + file.getOriginalFilename());
                }
            }
            attachmentRepository.saveAll(attachments);
            savedContent.setAttachments(new HashSet<>(attachments));
        }

        return getPostResponseWithInteraction(savedContent);
    }

    @Transactional
    @Override
    public PostResponse updatePostStatus(UUID postId, ContentStatus newStatus) {
        if (newStatus == null) {
            throw new BadRequestException("Status must not be null");
        }

        if (newStatus == ContentStatus.DELETED)
            throw new BadRequestException("Use delete API to delete content");

        if (newStatus == ContentStatus.DRAFT)
            throw new BadRequestException("Cannot change status of a published post to draft");

        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Not authorized to update status of this post");
        }

        if (content.getStatus() == newStatus) {
            return getPostResponseWithInteraction(content);
        }

        content.setStatus(newStatus);
        content.setLastEditedAt(LocalDateTime.now());
        if (newStatus == ContentStatus.PUBLISHED) {
            if (content.getPublishedAt() == null) {
                content.setPublishedAt(LocalDateTime.now());
            } else {
                content.setPublishedAt(content.getPublishedAt());
                content.setUpdatedAt(LocalDateTime.now());
            }
        }

        Content saved = contentRepository.save(content);
        return getPostResponseWithInteraction(saved);
    }

    @Transactional
    public PostResponse publishPost(UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Not authorized to publish this post");
        }

        if (content.getStatus() == ContentStatus.PUBLISHED) {
            throw new BadRequestException("Post is already published");
        }

        content.setStatus(ContentStatus.PUBLISHED);
        content.setPublishedAt(LocalDateTime.now());
        Content saved = contentRepository.save(content);
        return getPostResponseWithInteraction(saved);
    }

    @Override
    public PageResponse<PostSummaryResponse> getNewsfeedPosts(Pageable pageable) {
        List<ContentType> types = List.of(ContentType.POST, ContentType.SHARED_POST);
        Page<Content> page = contentRepository.findByContentTypeInAndStatus(
                types, ContentStatus.PUBLISHED, pageable);

        UUID currentUserId = serviceHelper.getCurrentUserId();
        return filterAndMapPostsByVisibility(page, currentUserId);
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByAuthor(UUID authorId, Pageable pageable) {
        if (!userRepository.existsById(authorId)) {
            throw new ResourceNotFoundException("Author not found with id: " + authorId);
        }
        List<ContentType> types = List.of(ContentType.POST, ContentType.SHARED_POST);
        Page<Content> postPage = contentRepository.findByAuthorIdAndContentTypeInAndStatusOrderByPublishedAtDesc(
                authorId, types, ContentStatus.PUBLISHED, pageable);
        UUID currentUserId = serviceHelper.getCurrentUserId();
        return filterAndMapPostsByVisibility(postPage, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getMyArchivedPosts(Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();

        Page<Content> archivedPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByUpdatedAtDesc(
                currentUser.getId(),
                ContentType.POST,
                ContentStatus.ARCHIVED,
                pageable
        );

        archivedPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });
        return contentMapper.contentPageToPostSummaryPage(archivedPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getMyPosts(ContentStatus status, Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();

        ContentStatus searchStatus = (status != null) ? status : ContentStatus.PUBLISHED;

        List<ContentType> types = List.of(ContentType.POST, ContentType.SHARED_POST);

        Page<Content> postPage;

        if (searchStatus == ContentStatus.DRAFT || searchStatus == ContentStatus.ARCHIVED) {
            postPage = contentRepository.findByAuthorIdAndContentTypeInAndStatusOrderByUpdatedAtDesc(
                    currentUser.getId(), types, searchStatus, pageable);
        } else {
            postPage = contentRepository.findByAuthorIdAndContentTypeInAndStatusOrderByPublishedAtDesc(
                    currentUser.getId(), types, searchStatus, pageable);
        }

        postPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });

        return contentMapper.contentPageToPostSummaryPage(postPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByTag(UUID tagId, Pageable pageable) {
        if (!tagRepository.existsById(tagId)) {
            throw new ResourceNotFoundException("Tag not found with id: " + tagId);
        }

        Page<Content> postPage = contentRepository.findPublishedPostsByTagId(tagId, pageable);
        UUID currentUserId = serviceHelper.getCurrentUserId();
        return filterAndMapPostsByVisibility(postPage, currentUserId);
    }


    @Override
    @Transactional
    public PostResponse getPostById(UUID postId) {
        Content content = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (content.getContentType() != ContentType.POST && content.getContentType() != ContentType.SHARED_POST) {
            throw new ResourceNotFoundException("Post not found");
        }

        if (content.getAuthor() != null) {
            Hibernate.initialize(content.getAuthor().getUserProfile());
        }

        User currentUser = serviceHelper.getCurrentUser();
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        if (!visibilityService.canUserViewContent(currentUserId, content)) {
            throw new UnauthorizedException("You don't have permission to view this post");
        }

        boolean isAuthor = currentUser != null && content.getAuthor().getId().equals(currentUser.getId());
        boolean isPublished = content.getStatus() == ContentStatus.PUBLISHED;

        if (!isPublished && !isAuthor) {
            throw new ResourceNotFoundException("Post not accessible");
        }

        if (isPublished && !isAuthor) {
            content.setViewCount(content.getViewCount() + 1);
            contentRepository.save(content);
        }

        return getPostResponseWithInteraction(content);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getMyDraftPosts(Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();

        Page<Content> draftPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByUpdatedAtDesc(
                currentUser.getId(), ContentType.POST, ContentStatus.DRAFT, pageable);

        draftPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });
        return contentMapper.contentPageToPostSummaryPage(draftPage);
    }

    @Override
    @Transactional
    public PostResponse getPostBySlug(String slug) {
        Content content = contentRepository.findBySlugAndContentTypeAndStatus(slug, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with slug: " + slug));

        if (content.getAuthor() != null) {
            Hibernate.initialize(content.getAuthor().getUserProfile());
        }

        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (!visibilityService.canUserViewContent(currentUserId, content)) {
            throw new UnauthorizedException("You don't have permission to view this post");
        }

        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        return getPostResponseWithInteraction(content);
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request, List<MultipartFile> files) {
        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("User is not authorized to update this post");
        }

        if (content.getPublishedAt() != null &&
                LocalDateTime.now().isAfter(content.getPublishedAt().plusHours(editLimitHours))) {
            throw new BadRequestException("Edit time limit exceeded (" + editLimitHours + " hours)");
        }

        ContentEditHistory history = new ContentEditHistory();
        history.setContent(content);
        history.setEditedBy(currentUser);
        history.setPreviousTitle(content.getTitle());
        history.setPreviousBody(content.getBody());
        history.setEditReason(request.getEditReason());
        editHistoryRepository.save(history);

        boolean titleChanged = request.getTitle() != null && !request.getTitle().equals(content.getTitle());
        content.setTitle(request.getTitle());
        content.setBody(request.getBody());
        content.setLastEditedAt(LocalDateTime.now());
        if (titleChanged) {
            content.setSlug(slugGenerator.generateSlug(request.getTitle()));
        }

        if (request.getVisibility() != null) {
            visibilityService.validateVisibilityUpdate(content, request.getVisibility());
            content.setVisibility(request.getVisibility());
        }

        // Fix cascade issue: delete old tags, flush to DB, then create new ones
        Set<ContentTag> oldTags = new HashSet<>(content.getContentTags());
        content.getContentTags().clear();
        contentRepository.saveAndFlush(content); // Flush để xóa associations trong DB
        contentTagRepository.deleteAll(oldTags);  // Xóa các ContentTag cũ
        contentTagRepository.flush();             // Đảm bảo delete hoàn tất trước khi insert

        associateTags(content, request.getTagIds());

        if (request.getAttachmentsToDelete() != null && !request.getAttachmentsToDelete().isEmpty()) {
            List<Attachment> attachmentsToDelete = attachmentRepository.findAllById(request.getAttachmentsToDelete());

            attachmentsToDelete.removeIf(att -> !att.getContent().getId().equals(postId));

            // Xóa file trên Cloud
            // for (Attachment att : attachmentsToDelete) {
            //      storageService.deleteFile(att.getStorageKey());
            // }

            attachmentsToDelete.forEach(content.getAttachments()::remove);
            attachmentRepository.deleteAll(attachmentsToDelete);
        }

        // Append new attachments if provided
        if (files != null && !files.isEmpty()) {
            List<Attachment> newAttachments = new ArrayList<>();
            for (MultipartFile file : files) {
                try {
                    Map<String, String> uploadResult = storageService.uploadFile(file);

                    Attachment attachment = new Attachment();
                    attachment.setContent(content);
                    attachment.setUploadedBy(currentUser);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setMimeType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    attachment.setStorageUrl(uploadResult.get("url"));
                    attachment.setStorageKey(uploadResult.get("key"));
                    attachment.setFileType(determineAttachmentType(Objects.requireNonNull(file.getContentType())));
                    attachment.setIsVerified(true);

                    newAttachments.add(attachment);
                } catch (IOException e) {
                    throw new BadRequestException("Failed to upload file: " + file.getOriginalFilename());
                }
            }
            attachmentRepository.saveAll(newAttachments);
            content.getAttachments().addAll(newAttachments);
        }

        Content updatedContent = contentRepository.save(content);
        return getPostById(updatedContent.getId());
    }

    @Transactional
    @Override
    public PostResponse updatePostVisibility(UUID postId, ContentVisibility newVisibility) {
        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only author can change post visibility");
        }

        visibilityService.validateVisibilityUpdate(content, newVisibility);

        content.setVisibility(newVisibility);
        content.setUpdatedAt(LocalDateTime.now());

        Content updated = contentRepository.save(content);
        return getPostResponseWithInteraction(updated);
    }

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        // Hàm findById này đã có sẵn @Query check deletedAt IS NULL trong ContentRepository
        Content content = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Kiểm tra hợp lệ: Chỉ cho phép xóa nếu là POST hoặc SHARED_POST
        if (content.getContentType() != ContentType.POST && content.getContentType() != ContentType.SHARED_POST) {
            throw new ResourceNotFoundException("Post not found with id: " + postId);
        }

        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId())
            /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this post");
        }

        // 1. Soft delete comments (Lưu ý: Đảm bảo ReactableType khớp với logic lúc tạo)
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, postId);

        // 2. Soft delete reactions
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, postId);

        // 3. Soft delete bookmarks
        bookmarkRepository.softDeleteByContentId(postId);

        // 4. Soft delete shares
        shareRepository.softDeleteByContentId(postId);

        // 5. Soft delete attachments
        attachmentRepository.softDeleteByContentId(postId);

        // 6. Hard delete ContentTags
        contentTagRepository.deleteByContentId(postId);

        // 7. Xử lý xóa các bài share CỦA bài viết này (Cascading delete for shares)
        // Logic này áp dụng được cho cả POST gốc lẫn SHARED_POST (nếu shared post bị share tiếp)
        contentRepository.softDeleteSharedPosts(postId);

        // 8. Cuối cùng xóa bài viết
        contentRepository.softDeleteById(postId);
    }
    /**
     * Restore a soft-deleted post
     */
    @Transactional
    @Override
    public PostResponse restorePost(UUID postId) {
        log.info("Restoring soft-deleted post: {}", postId);

        // Tìm content kể cả đã deleted
        Content content = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (content.getDeletedAt() == null) {
            throw new BadRequestException("Post is not deleted");
        }

        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId())) {
            throw new UnauthorizedException("User is not authorized to restore this post");
        }

        // Restore content
        content.setDeletedAt(null);
        content.setUpdatedAt(LocalDateTime.now());
        Content restoredContent = contentRepository.save(content);

        log.info("Successfully restored post: {}", postId);

        // Note: Các entities liên quan (comments, reactions, bookmarks) vẫn ở trạng thái soft-deleted
        // Có thể implement logic restore các entities này nếu cần

        return getPostResponseWithInteraction(restoredContent);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> searchPosts(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return PageResponse.<PostSummaryResponse>builder().content(List.of()).build();
        }

        Page<Content> postPage = contentRepository.searchPublishedPosts(query, pageable);
        UUID currentUserId = serviceHelper.getCurrentUserId();
        return filterAndMapPostsByVisibility(postPage, currentUserId);
    }

    /**
     * Get visibility info for a post
     */
    @Transactional(readOnly = true)
    @Override
    public VisibilityInfoResponse getPostVisibilityInfo(UUID postId) {
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User currentUser = serviceHelper.getCurrentUser();

        // Chỉ author mới xem được visibility info để edit
        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only author can view visibility settings");
        }

        List<ContentVisibility> availableOptions;
        String message = null;

        if (content.getGroup() != null) {
            // Post trong group -> không thể đổi visibility
            availableOptions = List.of(ContentVisibility.GROUP);
            message = "Posts in groups cannot change visibility";
        } else {
            // Post thông thường -> có thể chọn PUBLIC, FRIENDS_ONLY, PRIVATE
            availableOptions = List.of(
                    ContentVisibility.PUBLIC,
                    ContentVisibility.FRIENDS_ONLY,
                    ContentVisibility.PRIVATE
            );
        }

        return VisibilityInfoResponse.builder()
                .currentVisibility(content.getVisibility())
                .availableOptions(availableOptions)
                .isInGroup(content.getGroup() != null)
                .groupName(content.getGroup() != null ? content.getGroup().getName() : null)
                .message(message)
                .build();
    }

    // --- Helper Methods ---

    /**
     * Lấy các Tag entities từ DB và tạo các ContentTag entities để liên kết với Content.
     * Ném BadRequestException nếu có tagId không tồn tại.
     */
    private void associateTags(Content content, Set<UUID> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            throw new BadRequestException("At least one tag is required for a post."); // Hoặc cho phép post không tag?
        }

        List<Tag> tags = tagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
            // Tìm các ID không hợp lệ
            Set<UUID> foundIds = tags.stream().map(Tag::getId).collect(Collectors.toSet());
            Set<UUID> notFoundIds = tagIds.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toSet());
            throw new BadRequestException("Tags not found with IDs: " + notFoundIds);
        }

        Set<ContentTag> contentTags = new HashSet<>();
        LocalDateTime now = LocalDateTime.now();
        for (Tag tag : tags) {
            ContentTag contentTag = new ContentTag();
            contentTag.setContent(content);
            contentTag.setTag(tag);
//            contentTag.setContentTagId(new ContentTagId(content.getId(), tag.getId()));
            contentTag.setCreatedAt(now); // Set timestamp cho bảng join
            contentTags.add(contentTag);
        }
//        contentTagRepository.saveAll(contentTags); // Lưu các liên kết mới
        content.setContentTags(contentTags); // Cập nhật lại collection trong Content entity
    }


    private PostResponse getPostResponseWithInteraction(Content content) {
        return getPostResponseWithInteractionAndVisibility(content);
    }

    /**
     * Helper method to prepare PostResponse with visibility-aware originalContent
     */
    private PostResponse getPostResponseWithInteractionAndVisibility(Content content) {
        PostResponse response = contentMapper.contentToPostResponse(content);

        UUID currentUserId = serviceHelper.getCurrentUserId();

        // Set interaction status
        if (currentUserId != null) {
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(content.getId()));
            ReactionType reactionType = interactionService.getCurrentUserReaction(ReactableType.CONTENT, content.getId());
            response.setCurrentUserReaction(reactionType);
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserReaction(null);
        }

        // Handle originalContent visibility
        if (response.getOriginalPost() != null) {
            Content originalContent = content.getOriginalContent();

            // Check if current user can view original content
            if (originalContent != null && !visibilityService.canUserViewContent(currentUserId, originalContent)) {
                // User không có quyền xem bài gốc -> Set originalPost = null
                // Hoặc set một placeholder message
                response.setOriginalPost(null);
            }
        }

        return response;
    }

    private AttachmentType determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) return AttachmentType.IMAGE;
        if (mimeType.equals("application/pdf")) return AttachmentType.PDF;
        return AttachmentType.OTHER;
    }

    /**
     * Helper method to filter contents by visibility and map to response
     * Tái sử dụng cho nhiều methods: getNewsfeedPosts, getPostsByTag, getPostsByAuthor, searchPosts
     */
    private PageResponse<PostSummaryResponse> filterAndMapPostsByVisibility(
            Page<Content> postPage,
            UUID currentUserId) {

        // Initialize lazy-loaded associations
        postPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });

        // Filter by visibility permission
        List<Content> visibleContents = postPage.getContent().stream()
                .filter(content -> visibilityService.canUserViewContent(currentUserId, content))
                .toList();

        // Map to DTO
        PageResponse<PostSummaryResponse> response = contentMapper.contentPageToPostSummaryPage(postPage);

        // Filter response to match visible contents
        List<PostSummaryResponse> filteredResponse = response.getContent().stream()
                .filter(post -> visibleContents.stream()
                        .anyMatch(c -> c.getId().equals(post.getId())))
                .toList();

        response.setContent(filteredResponse);
        response.setNumberOfElements(filteredResponse.size());

        // Set interaction status for visible posts
        if (currentUserId != null && response.getContent() != null) {
            for (PostSummaryResponse post : response.getContent()) {
                post.setBookmarkedByCurrentUser(
                        interactionService.isContentBookmarkedByUser(post.getId()));
                post.setCurrentUserReaction(
                        interactionService.getCurrentUserReaction(ReactableType.CONTENT, post.getId()));
            }
        }

        return response;
    }
}
