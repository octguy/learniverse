package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.SharePostRequest;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.model.Share;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ContentRepository;
import org.example.learniversebe.repository.ShareRepository;
import org.example.learniversebe.service.ContentVisibilityService;
import org.example.learniversebe.service.IShareService;
import org.example.learniversebe.util.ServiceHelper;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
public class ShareServiceImpl implements IShareService {

    private final ContentRepository contentRepository;
    private final ShareRepository shareRepository;
    private final ServiceHelper serviceHelper;
    private final ContentMapper contentMapper;
    private final SlugGenerator slugGenerator;
    private final ContentVisibilityService visibilityService;

    public ShareServiceImpl(ContentRepository contentRepository,
                            ShareRepository shareRepository,
                            ServiceHelper serviceHelper,
                            ContentMapper contentMapper,
                            SlugGenerator slugGenerator,
                            ContentVisibilityService visibilityService) {
        this.contentRepository = contentRepository;
        this.shareRepository = shareRepository;
        this.serviceHelper = serviceHelper;
        this.contentMapper = contentMapper;
        this.slugGenerator = slugGenerator;
        this.visibilityService = visibilityService;
    }

    @Override
    @Transactional
    public PostResponse shareToFeed(SharePostRequest request) {
        User currentUser = serviceHelper.getCurrentUser();

        // 1. Validate Original Content
        Content originalContent = contentRepository.findById(request.getOriginalContentId())
                .orElseThrow(() -> new ResourceNotFoundException("Original content not found"));

        // Check visibility permission - User phải có quyền xem bài gốc mới được share
        if (!visibilityService.canUserViewContent(currentUser.getId(), originalContent)) {
            throw new UnauthorizedException("You don't have permission to share this post");
        }

        // Check logic: Không cho share bài nháp hoặc bài đã xóa
        if (originalContent.getStatus() != ContentStatus.PUBLISHED || originalContent.getDeletedAt() != null) {
            throw new BadRequestException("Cannot share a content that is not published or deleted.");
        }

        // Group PRIVATE không cho share ra ngoài
        if (originalContent.getGroup() != null &&
                originalContent.getGroup().getPrivacy() == GroupPrivacy.PRIVATE) {
            throw new BadRequestException("Cannot share posts from private groups");
        }

        // Logic Edge Case: Nếu share một bài vốn đã là bài share (Share of a share)
        Content actualOriginal = originalContent.getOriginalContent() != null ? originalContent.getOriginalContent() : originalContent;

        // 2. Tạo Content mới (Shared Post)
        Content sharedPost = new Content();
        sharedPost.setAuthor(currentUser);
        sharedPost.setContentType(ContentType.SHARED_POST);
        sharedPost.setStatus(ContentStatus.PUBLISHED);
        sharedPost.setPublishedAt(LocalDateTime.now());

        sharedPost.setBody(request.getCaption() != null ? request.getCaption() : "");

        String shareTitle = "Shared: " + actualOriginal.getTitle();
        sharedPost.setTitle(shareTitle);
        sharedPost.setSlug(slugGenerator.generateSlug(shareTitle + " " + System.currentTimeMillis()));

        sharedPost.setOriginalContent(actualOriginal);

        ContentVisibility shareVisibility = request.getVisibility() != null
                ? request.getVisibility()
                : ContentVisibility.PUBLIC;
        sharedPost.setVisibility(shareVisibility);

        contentRepository.save(sharedPost);

        recordShareInteraction(currentUser, actualOriginal, ShareType.NEWSFEED);

        return contentMapper.contentToPostResponse(sharedPost);
    }

    @Override
    @Transactional
    public void trackShareAction(SharePostRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findById(request.getOriginalContentId())
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));

        ShareType type = request.getShareType() != null ? request.getShareType() : ShareType.DIRECT_MESSAGE;

        recordShareInteraction(currentUser, content, type);
    }

    /**
     * Hàm helper xử lý việc ghi log Share và tăng count
     * Xử lý vấn đề trùng lặp khóa và Soft Delete
     */
    private void recordShareInteraction(User user, Content content, ShareType type) {
        // 1. Tăng count ở Content (Luôn cộng dồn để thể hiện độ viral)
        content.setShareCount(content.getShareCount() + 1);
        contentRepository.save(content);

        // 2. Xử lý bảng Share (Log)
        Optional<Share> existingShareOpt = shareRepository.findBySharedByIdAndContentIdAndShareType(
                user.getId(), content.getId(), type
        );

        if (existingShareOpt.isPresent()) {
            Share existingShare = existingShareOpt.get();
            if (existingShare.getDeletedAt() != null) {
                existingShare.setDeletedAt(null);
                shareRepository.save(existingShare);
            }
        } else {
            Share newShare = new Share();
            newShare.setSharedBy(user);
            newShare.setContent(content);
            newShare.setShareType(type);
            shareRepository.save(newShare);
        }
    }
}