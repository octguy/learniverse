package org.example.learniversebe.service.implementation;

import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.UpdatePostRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.model.composite_key.ContentTagId;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.service.IPostService;
import org.example.learniversebe.util.ServiceHelper;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
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
                           ShareRepository shareRepository // Inject
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
    }

    @Override
    @Transactional // Đảm bảo tất cả thao tác DB thành công hoặc rollback
    public PostResponse createPost(CreatePostRequest request) {
        User author = serviceHelper.getCurrentUser(); // Lấy user đang đăng nhập

        // Map DTO sang Entity
        Content content = contentMapper.createPostRequestToContent(request);
        content.setAuthor(author);
        content.setContentType(ContentType.POST); // Đảm bảo đúng type
        content.setStatus(ContentStatus.PUBLISHED); // Giả sử đăng ngay
        content.setPublishedAt(LocalDateTime.now());
        content.setSlug(slugGenerator.generateSlug(request.getTitle() != null ? request.getTitle() : request.getBody().substring(0, Math.min(request.getBody().length(), 50)))); // Tạo slug

        // Xử lý Tags
        associateTags(content, request.getTagIds());

        // Lưu Content trước để có ID
        Content savedContent = contentRepository.save(content);

        // Map lại sang Response DTO (đã bao gồm author và tags)
        PostResponse response = contentMapper.contentToPostResponse(savedContent);
        // Set trạng thái tương tác ban đầu (mới tạo thì chưa bookmark/react)
        response.setBookmarkedByCurrentUser(false);
        response.setCurrentUserReaction(null);
        return response;
    }

    @Override
    @Transactional(readOnly = true) // Chỉ đọc dữ liệu
    public PageResponse<PostSummaryResponse> getNewsfeedPosts(Pageable pageable) {
        Page<Content> postPage = contentRepository.findByContentTypeAndStatusOrderByPublishedAtDesc(ContentType.POST, ContentStatus.PUBLISHED, pageable);
        // Mapper sẽ tự chuyển Page<Content> sang PageResponse<PostSummaryResponse>
        PageResponse<PostSummaryResponse> response = contentMapper.contentPageToPostSummaryPage(postPage);
        // Có thể thêm logic lấy trạng thái tương tác cho từng post ở đây nếu cần (hơi tốn kém)
        return response;
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByAuthor(UUID authorId, Pageable pageable) {
        // Kiểm tra author tồn tại (không bắt buộc nhưng nên có)
        if (!userRepository.existsById(authorId)) {
            throw new ResourceNotFoundException("Author not found with id: " + authorId);
        }
        Page<Content> postPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(authorId, ContentType.POST, ContentStatus.PUBLISHED, pageable);
        return contentMapper.contentPageToPostSummaryPage(postPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPostsByTag(UUID tagId, Pageable pageable) {
        // Kiểm tra tag tồn tại
        if (!tagRepository.existsById(tagId)) {
            throw new ResourceNotFoundException("Tag not found with id: " + tagId);
        }
        // Cần phương thức trong ContentRepository để tìm theo tagId (JOIN với content_tag)
        Page<Content> postPage = contentRepository.findPublishedPostsByTagId(tagId, pageable);
        return contentMapper.contentPageToPostSummaryPage(postPage);
    }


    @Override
    @Transactional // Cần Transactional vì có thể update view count
    public PostResponse getPostById(UUID postId) {
        Content content = contentRepository.findByIdAndContentTypeAndStatus(postId, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Tăng view count (logic đơn giản, có thể cần cơ chế chống spam view)
        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content); // Lưu lại view count

        // Map sang DTO chi tiết
        PostResponse response = contentMapper.contentToPostResponse(content);

        // Lấy trạng thái tương tác của user hiện tại
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(postId));
            // TODO: Lấy reaction hiện tại của user cho post này (cần hàm trong IInteractionService)
            // response.setCurrentUserReaction(interactionService.getCurrentUserReactionFor(ReactableType.CONTENT, postId));
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserReaction(null);
        }

        return response;
    }

    @Override
    @Transactional
    public PostResponse getPostBySlug(String slug) {
        Content content = contentRepository.findBySlugAndContentTypeAndStatus(slug, ContentType.POST, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with slug: " + slug));

        // Tăng view count
        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        PostResponse response = contentMapper.contentToPostResponse(content);

        // Lấy trạng thái tương tác
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(content.getId()));
            // TODO: Lấy reaction hiện tại
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserReaction(null);
        }

        return response;
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Kiểm tra quyền sở hữu
        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("User is not authorized to update this post");
        }

        // Kiểm tra thời gian chỉnh sửa (ví dụ: 24 giờ)
        if (content.getPublishedAt() != null &&
                LocalDateTime.now().isAfter(content.getPublishedAt().plusHours(editLimitHours))) {
            throw new BadRequestException("Edit time limit exceeded (" + editLimitHours + " hours)");
        }

        // Lưu lịch sử chỉnh sửa trước khi cập nhật
        ContentEditHistory history = new ContentEditHistory();
        history.setContent(content);
        history.setEditedBy(currentUser);
        history.setPreviousTitle(content.getTitle());
        history.setPreviousBody(content.getBody());
        history.setEditReason(request.getEditReason());
        // history.setEditedAt() sẽ được set bởi @PrePersist
        editHistoryRepository.save(history);

        // Cập nhật thông tin
        boolean titleChanged = request.getTitle() != null && !request.getTitle().equals(content.getTitle());
        content.setTitle(request.getTitle());
        content.setBody(request.getBody());
        // Cập nhật slug nếu tiêu đề thay đổi đáng kể (tùy chọn)
        if (titleChanged) {
            content.setSlug(slugGenerator.generateSlug(request.getTitle()));
        }

        // Cập nhật Tags (Xóa cũ, thêm mới)
        contentTagRepository.deleteAll(content.getContentTags()); // Xóa liên kết cũ
        content.getContentTags().clear(); // Xóa khỏi collection trong entity
        associateTags(content, request.getTagIds()); // Thêm liên kết mới

        Content updatedContent = contentRepository.save(content); // Lưu thay đổi

        // Map và trả về, lấy lại trạng thái tương tác
        return getPostById(updatedContent.getId());
    }

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findByIdAndContentType(postId, ContentType.POST)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Kiểm tra quyền (tác giả hoặc admin/mod)
        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId()) /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this post");
        }

        // 1. Soft delete Content (đã cấu hình bằng @SQLDelete)
        contentRepository.delete(content);

        // 2. BỔ SUNG: Xóa mềm các thành phần liên quan
        // (Giả sử các Repository đã có các phương thức softDelete... hoặc delete... phù hợp)

        // Xóa mềm ContentTags (quan hệ join table)
        contentTagRepository.deleteByContentId(postId); // Xóa vật lý hoặc thêm soft delete nếu C-T là entity

        // Xóa mềm Comments
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, postId);

        // Xóa mềm Reactions
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, postId);

        // Xóa mềm Bookmarks
        bookmarkRepository.softDeleteByContentId(postId);

        // Xóa mềm Shares
        shareRepository.softDeleteByContentId(postId);

        // Xóa mềm Attachments (nếu @OneToMany không có cascade soft delete)
        // attachmentRepository.softDeleteByContentId(postId); // Cần method này

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
