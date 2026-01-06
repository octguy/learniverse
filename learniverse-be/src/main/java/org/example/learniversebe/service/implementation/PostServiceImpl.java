package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.UpdatePostRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
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
                           ShareRepository shareRepository, IStorageService storageService,
                           AttachmentRepository attachmentRepository
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
    }

    @Override
    @Transactional // Đảm bảo tất cả thao tác DB thành công hoặc rollback
    public PostResponse createPost(CreatePostRequest request, List<MultipartFile> files) {
        log.info("Creating new post with title: {}", request.getTitle());
        User author = serviceHelper.getCurrentUser(); // Lấy user đang đăng nhập

        // Map DTO sang Entity
        Content content = contentMapper.createPostRequestToContent(request);
        content.setAuthor(author);
        content.setContentType(ContentType.POST);
        content.setStatus(request.getStatus() != null ? request.getStatus() : ContentStatus.PUBLISHED);
        if (content.getStatus() == ContentStatus.PUBLISHED) {
            content.setPublishedAt(LocalDateTime.now());
        }
        content.setSlug(slugGenerator.generateSlug(request.getTitle() != null ? request.getTitle() : request.getBody().substring(0, Math.min(request.getBody().length(), 50)))); // Tạo slug

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

    private PostResponse getPostResponseWithInteraction(Content content) {
        PostResponse response = contentMapper.contentToPostResponse(content);
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(content.getId()));
            ReactionType reactionType = interactionService.getCurrentUserReaction(ReactableType.CONTENT, content.getId());
            response.setCurrentUserReaction(reactionType);
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserReaction(null);
        }
        return response;
    }

    private AttachmentType determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) return AttachmentType.IMAGE;
        if (mimeType.equals("application/pdf")) return AttachmentType.PDF;
        return AttachmentType.OTHER;
    }

    @Transactional
    @Override
    public PostResponse updatePostStatus(UUID postId, ContentStatus newStatus) {
        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Not authorized to update status of this post");
        }

        if (newStatus == ContentStatus.DELETED) {
            throw new BadRequestException("Use delete API to delete content");
        }

        if (newStatus == ContentStatus.DRAFT) {
            throw new BadRequestException("Cannot change status of a published post to draft");
        }

        ContentStatus oldStatus = content.getStatus();

        if (oldStatus == newStatus) {
            return getPostResponseWithInteraction(content);
        }

        content.setStatus(newStatus);

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

    @Override
    public PageResponse<PostSummaryResponse> getNewsfeedPosts(Pageable pageable) {
        List<ContentType> types = List.of(ContentType.POST, ContentType.SHARED_POST);
        Page<Content> page = contentRepository.findByContentTypeInAndStatus(
                types, ContentStatus.PUBLISHED, pageable);

        page.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });

        PageResponse<PostSummaryResponse> response = contentMapper.contentPageToPostSummaryPage(page);

        UUID currentUserId = serviceHelper.getCurrentUserId();
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


    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByAuthor(UUID authorId, Pageable pageable) {
        if (!userRepository.existsById(authorId)) {
            throw new ResourceNotFoundException("Author not found with id: " + authorId);
        }
        List<ContentType> types = List.of(ContentType.POST, ContentType.SHARED_POST);
        Page<Content> postPage = contentRepository.findByAuthorIdAndContentTypeInAndStatusOrderByPublishedAtDesc(
                authorId, types, ContentStatus.PUBLISHED, pageable);

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
        postPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });
        return contentMapper.contentPageToPostSummaryPage(postPage);
    }


    @Override
    @Transactional
    public PostResponse getPostById(UUID postId) {
        Content content = contentRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (content.getContentType() != ContentType.POST && content.getContentType() != ContentType.SHARED_POST) {
            throw new ResourceNotFoundException("Post not found");
        }

        User currentUser = serviceHelper.getCurrentUser();

        if (content.getAuthor() != null) {
            Hibernate.initialize(content.getAuthor().getUserProfile());
        }

        boolean isAuthor = currentUser != null && content.getAuthor().getId().equals(currentUser.getId());
        boolean isPublished = content.getStatus() == ContentStatus.PUBLISHED;

        if (!isPublished && !isAuthor) {
            throw new ResourceNotFoundException("Post not found or not accessible");
        }

        if (isPublished && !isAuthor) {
            content.setViewCount(content.getViewCount() + 1);
            contentRepository.save(content);
        }

        return getPostResponseWithInteraction(content);
    }

    @Override
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

    @Transactional(readOnly = true)
    @Override
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

    @Transactional(readOnly = true)
    @Override
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
    @Transactional
    public PostResponse getPostBySlug(String slug) {
        Content content = contentRepository.findBySlugAndContentTypeAndStatus(slug, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with slug: " + slug));

        if (content.getAuthor() != null) {
            Hibernate.initialize(content.getAuthor().getUserProfile());
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
        if (titleChanged) {
            content.setSlug(slugGenerator.generateSlug(request.getTitle()));
        }

        contentTagRepository.deleteAll(content.getContentTags());
        content.getContentTags().clear();
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

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId())
            /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this post");
        }

        // 1. Soft delete comments (bao gồm cả replies)
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, postId);

        // 2. Soft delete reactions
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, postId);

        // 3. Soft delete bookmarks
        bookmarkRepository.softDeleteByContentId(postId);

        // 4. Soft delete shares
        shareRepository.softDeleteByContentId(postId);

        // 5. Soft delete attachments (optional - có thể giữ lại để recover)
        attachmentRepository.softDeleteByContentId(postId);

        // 6. Hard delete ContentTags (vì đây là bảng join, không cần soft delete)
        contentTagRepository.deleteByContentId(postId);

        // 7. Giữ lại edit history để audit (không xóa)
        // log.debug("Keeping edit history for audit purposes");

        contentRepository.softDeleteById(postId);
    }

    /**
     * Restore a soft-deleted post
     */
    @Transactional
    @Override
    public PostResponse restorePost(UUID postId) {
        log.info("Restoring soft-deleted post: {}", postId);

        User currentUser = serviceHelper.getCurrentUser();

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
            return PageResponse.<PostSummaryResponse>builder().content(List.of()).build(); // Trả về trang rỗng nếu query trống
        }
        Page<Content> postPage = contentRepository.searchPublishedPosts(query, pageable);

        postPage.getContent().forEach(content -> {
            if (content.getAuthor() != null) {
                Hibernate.initialize(content.getAuthor().getUserProfile());
            }
        });
        return contentMapper.contentPageToPostSummaryPage(postPage);
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
}
