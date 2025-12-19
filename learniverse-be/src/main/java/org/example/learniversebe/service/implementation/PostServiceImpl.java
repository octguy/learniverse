package org.example.learniversebe.service.implementation;

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
    @Transactional
    public PostResponse createPost(CreatePostRequest request, List<MultipartFile> files) {
        User author = serviceHelper.getCurrentUser();

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

    @Override
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
        Page<Content> page = contentRepository.findByContentTypeAndStatus(
                ContentType.POST, ContentStatus.PUBLISHED, pageable);

        PageResponse<PostSummaryResponse> response = contentMapper.contentPageToPostSummaryPage(page);

        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && response.getContent() != null) {
            List<UUID> postIds = response.getContent().stream()
                    .map(PostSummaryResponse::getId).toList();

            for (PostSummaryResponse post : response.getContent()) {
                post.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(post.getId()));
                post.setCurrentUserReaction(interactionService.getCurrentUserReaction(ReactableType.CONTENT, post.getId()));
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
        Page<Content> postPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(authorId, ContentType.POST, ContentStatus.PUBLISHED, pageable);
        return contentMapper.contentPageToPostSummaryPage(postPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByTag(UUID tagId, Pageable pageable) {
        if (!tagRepository.existsById(tagId)) {
            throw new ResourceNotFoundException("Tag not found with id: " + tagId);
        }
        Page<Content> postPage = contentRepository.findPublishedPostsByTagId(tagId, pageable);
        return contentMapper.contentPageToPostSummaryPage(postPage);
    }


    @Override
    @Transactional
    public PostResponse getPostById(UUID postId) {
        Content content = contentRepository.findByIdAndContentTypeAndStatus(postId, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        return getPostResponseWithInteraction(content);
    }

    @Override
    @Transactional
    public PostResponse getPostBySlug(String slug) {
        Content content = contentRepository.findBySlugAndContentTypeAndStatus(slug, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with slug: " + slug));

        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        return getPostResponseWithInteraction(content);
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request) {
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
        // history.setEditedAt() sẽ được set bởi @PrePersist
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

        Content updatedContent = contentRepository.save(content);
        return getPostById(updatedContent.getId());
    }

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId()) /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this post");
        }

        contentRepository.delete(content);
        contentTagRepository.deleteByContentId(postId);
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, postId);
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, postId);
        bookmarkRepository.softDeleteByContentId(postId);
        shareRepository.softDeleteByContentId(postId);

        // Xóa mềm Attachments (nếu @OneToMany không có cascade soft delete)
        // attachmentRepository.softDeleteByContentId(postId);

        // Lịch sử chỉnh sửa có thể giữ lại
        // editHistoryRepository.softDeleteByContentId(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> searchPosts(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return PageResponse.<PostSummaryResponse>builder().content(List.of()).build(); // Trả về trang rỗng nếu query trống
        }
        Page<Content> postPage = contentRepository.searchPublishedPosts(query, pageable);
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
