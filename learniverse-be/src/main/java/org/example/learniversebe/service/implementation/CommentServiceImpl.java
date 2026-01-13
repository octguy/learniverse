package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateCommentRequest;
import org.example.learniversebe.dto.request.UpdateCommentRequest;
import org.example.learniversebe.dto.response.CommentResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.CommentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.ContentModerationService;
import org.example.learniversebe.service.ICommentService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CommentServiceImpl implements ICommentService {

    private final CommentRepository commentRepository;
    private final ContentRepository contentRepository; // Để tìm commentable Content
    private final AnswerRepository answerRepository;   // Để tìm commentable Answer
    private final UserRepository userRepository;       // Để tìm author và mentioned users
    private final MentionRepository mentionRepository; // Để lưu mentions
    private final CommentMapper commentMapper;
    private final ServiceHelper serviceHelper;
    private final ReactionRepository reactionRepository;
    private final ContentModerationService moderationService;
//    private final IInteractionService interactionService; // Inject InteractionService
     private final INotificationService notificationService;

    @Value("${app.comment.edit.limit-minutes:15}") // Giới hạn sửa comment, ví dụ 15 phút
    private long commentEditLimitMinutes;

    @Value("${app.comment.max-depth:3}") // Giới hạn độ sâu reply
    private int maxCommentDepth;

    public CommentServiceImpl(CommentRepository commentRepository,
                              ContentRepository contentRepository,
                              AnswerRepository answerRepository,
                              UserRepository userRepository,
                              MentionRepository mentionRepository, // Inject
                              CommentMapper commentMapper,
                              ServiceHelper serviceHelper,
//                              @Lazy IInteractionService interactionService,
                              ReactionRepository reactionRepository,
                              ContentModerationService moderationService,
                              INotificationService notificationService

            /*, INotificationService notificationService */) {
        this.commentRepository = commentRepository;
        this.contentRepository = contentRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.mentionRepository = mentionRepository;
        this.commentMapper = commentMapper;
        this.serviceHelper = serviceHelper;

//        this.interactionService = interactionService;
        // this.notificationService = notificationService;
        this.reactionRepository = reactionRepository;
        this.moderationService = moderationService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public CommentResponse addComment(CreateCommentRequest request) {
        log.info("Adding comment to {} with ID: {}", request.getCommentableType(), request.getCommentableId());
        User author = serviceHelper.getCurrentUser();
        if (!moderationService.isContentSafe(request.getBody())) {
            log.info(request.getBody());
            throw new BadRequestException("Bình luận của bạn chứa ngôn từ không phù hợp hoặc vi phạm tiêu chuẩn cộng đồng.");
        }

        Comment parentComment = null;
        int depth;

        // 1. Xác thực Commentable Entity và Parent Comment (nếu có)
        validateCommentableEntity(request.getCommentableType(), request.getCommentableId());
        if (request.getParentId() != null) {
            parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found with id: " + request.getParentId()));
            // Kiểm tra độ sâu nesting
            depth = calculateDepth(parentComment) + 1;
            if (depth > maxCommentDepth) {
                throw new BadRequestException("Comment nesting level exceeds maximum depth of " + maxCommentDepth);
            }
            // Đảm bảo parent comment thuộc cùng commentable entity (tùy chọn)
            if (!parentComment.getCommentableId().equals(request.getCommentableId()) ||
                    !parentComment.getCommentableType().equals(request.getCommentableType())) {
                throw new BadRequestException("Parent comment does not belong to the same entity.");
            }
        }

        // 2. Map DTO sang Entity và set thông tin
        Comment comment = commentMapper.createCommentRequestToComment(request);
        comment.setAuthor(author);
        comment.setParent(parentComment);
        // @PrePersist sẽ set ID và timestamps

        // 3. Lưu Comment
        Comment savedComment = commentRepository.save(comment);

        // 4. Cập nhật Counts
        updateCommentableCommentCount(request.getCommentableType(), request.getCommentableId(), 1);
        if (parentComment != null) {
            parentComment.setReplyCount(parentComment.getReplyCount() + 1);
            commentRepository.save(parentComment);
        }

        // 5. Xử lý Mentions
        processMentions(savedComment, author, request.getMentionedUserIds());

        // 6. Gửi Notifications
        if (parentComment != null) {
            // Reply to comment -> notify parent comment author
            notificationService.notifyNewReply(parentComment.getAuthor(), author, savedComment);
        } else {
            // Direct comment -> notify entity author (Content/Answer)
            User entityAuthor = getEntityAuthor(request.getCommentableType(), request.getCommentableId());
            if (entityAuthor != null && !entityAuthor.getId().equals(author.getId())) {
                notificationService.notifyNewComment(entityAuthor, author, savedComment);
            }
        }

        // 7. Map sang Response DTO
        CommentResponse response = commentMapper.commentToCommentResponse(savedComment);
        // Set trạng thái tương tác ban đầu
        setInteractionStatusForCurrentUser(response, author.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getCommentsFor(ReactableType type, UUID id, Pageable pageable) {
        // 1. Tìm comment theo Type và ID (Generic)
        Page<Comment> commentPage = commentRepository.findByCommentableTypeAndCommentableId(type, id, pageable);

        // 2. Map sang DTO
        PageResponse<CommentResponse> response = commentMapper.commentPageToCommentPageResponse(commentPage);
        List<CommentResponse> commentDTOs = response.getContent();

        if (commentDTOs.isEmpty()) {
            return response;
        }

        // 3. Xử lý Reaction (N+1 Optimization)
        UUID currentUserId = serviceHelper.getCurrentUserId();

        if (currentUserId != null) {
            List<UUID> commentIds = commentDTOs.stream()
                    .map(CommentResponse::getId)
                    .toList();

            // Query 1 lần lấy reaction cho toàn bộ comment trong trang này
            List<Reaction> reactions = reactionRepository.findByUserIdAndReactableTypeAndReactableIdIn(
                    currentUserId,
                    ReactableType.COMMENT,
                    commentIds
            );

            Map<UUID, ReactionType> reactionMap = reactions.stream()
                    .collect(Collectors.toMap(
                            Reaction::getReactableId,
                            Reaction::getReactionType,
                            (existing, replacement) -> existing
                    ));

            for (CommentResponse dto : commentDTOs) {
                if (reactionMap.containsKey(dto.getId())) {
                    dto.setCurrentUserReaction(reactionMap.get(dto.getId()));
                }
            }
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getRepliesForComment(UUID parentId, Pageable pageable) {
        if (!commentRepository.existsById(parentId)) {
            throw new ResourceNotFoundException("Parent comment not found with id: " + parentId);
        }
        Page<Comment> replyPage = commentRepository.findByParentIdOrderByCreatedAtAsc(parentId, pageable);
        PageResponse<CommentResponse> responsePage = commentMapper.commentPageToCommentPageResponse(replyPage);

        // Lấy trạng thái tương tác
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && responsePage != null && responsePage.getContent() != null) {
            responsePage.getContent().forEach(commentDto -> setInteractionStatusForCurrentUser(commentDto, currentUserId));
        }
        return responsePage;
    }

    @Override
    @Transactional(readOnly = true)
    public CommentResponse getCommentById(UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        CommentResponse response = commentMapper.commentToCommentResponse(comment);

        // Lấy trạng thái tương tác
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            setInteractionStatusForCurrentUser(response, currentUserId);
        }
        return response;
    }

    @Override
    @Transactional
    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        // Kiểm tra quyền sở hữu
        serviceHelper.ensureCurrentUserIsAuthor(comment.getAuthor().getId(), "update comment");

        // Kiểm tra thời gian sửa
        if (comment.getCreatedAt() != null &&
                LocalDateTime.now().isAfter(comment.getCreatedAt().plusMinutes(commentEditLimitMinutes))) {
            throw new BadRequestException("Edit time limit exceeded (" + commentEditLimitMinutes + " minutes)");
        }

        if (!comment.getBody().equals(request.getBody())) {
            if (!moderationService.isContentSafe(request.getBody())) {
                throw new BadRequestException("Nội dung chỉnh sửa chứa ngôn từ không phù hợp.");
            }
        }

        // Cập nhật nội dung
        comment.setBody(request.getBody());
        // @PreUpdate sẽ set isEdited và updatedAt

        // Xử lý Mentions (Xóa cũ, thêm mới)
        mentionRepository.deleteByCommentId(commentId); // Xóa mentions cũ
        processMentions(comment, currentUser, request.getMentionedUserIds()); // Thêm mentions mới

        Comment updatedComment = commentRepository.save(comment);

        CommentResponse response = commentMapper.commentToCommentResponse(updatedComment);
        setInteractionStatusForCurrentUser(response, currentUser.getId());
        return response;
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId) {
        User currentUser = serviceHelper.getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("User is not authorized to delete this comment");
        }

        int totalDeletedCount = 1;

        totalDeletedCount += deleteRepliesRecursively(comment);

        updateCommentableCommentCount(comment.getCommentableType(), comment.getCommentableId(), -totalDeletedCount);

        if (comment.getParent() != null) {
            Comment parent = comment.getParent();
            parent.setReplyCount(Math.max(0, parent.getReplyCount() - 1));
            commentRepository.save(parent);
        }

        commentRepository.delete(comment);
        mentionRepository.softDeleteByCommentId(commentId);
        reactionRepository.softDeleteByReactable(ReactableType.COMMENT, commentId);
    }

    // --- Helper Methods ---

    /** Kiểm tra xem commentable entity có tồn tại không */
    private void validateCommentableEntity(ReactableType type, UUID id) {
        boolean exists = switch (type) {
            case CONTENT -> contentRepository.existsById(id);
            case ANSWER -> answerRepository.existsById(id);
            case COMMENT -> commentRepository.existsById(id); // Không nên comment vào comment khác type
            // default -> throw new BadRequestException("Invalid commentable type: " + type);
        };
        if (!exists) {
            throw new ResourceNotFoundException(type + " not found with id: " + id);
        }
    }

    /** Cập nhật comment count trên Content hoặc Answer */
    private void updateCommentableCommentCount(ReactableType type, UUID id, int delta) {
        switch (type) {
            case CONTENT:
                contentRepository.findById(id).ifPresent(c -> {
                    c.setCommentCount(Math.max(0, c.getCommentCount() + delta));
                    contentRepository.save(c);
                });
                break;
            case ANSWER:
                // Answer entity hiện chưa có commentCount, nếu cần thì thêm vào
                break;
            case COMMENT:
                // Không làm gì khi comment vào COMMENT
                break;
        }
    }

    /** Xử lý tạo Mention entities */
    private void processMentions(Comment comment, User mentioner, Set<UUID> mentionedUserIds) {
        if (mentionedUserIds != null && !mentionedUserIds.isEmpty()) {
            List<User> mentionedUsers = userRepository.findAllById(mentionedUserIds);
            Set<Mention> mentions = new HashSet<>();
            LocalDateTime now = LocalDateTime.now();
            for (User mentionedUser : mentionedUsers) {
                // Không tự mention chính mình
                if (!mentionedUser.getId().equals(mentioner.getId())) {
                    Mention mention = new Mention();
                    mention.setComment(comment);
                    mention.setMentionedUser(mentionedUser);
                    mention.setMentionedBy(mentioner);
                    mention.setCreatedAt(now);
                    mention.setUpdatedAt(now);
                    mentions.add(mention);

                    // TODO: Gửi notification cho mentionedUser
                    // notificationService.notifyMention(...)
                }
            }
            if (!mentions.isEmpty()) {
                mentionRepository.saveAll(mentions);
            }
        }
    }

    /** Tính độ sâu của comment */
    private int calculateDepth(Comment comment) {
        int depth = 0;
        Comment current = comment;
        while (current.getParent() != null && depth <= maxCommentDepth + 1) { // +1 để phát hiện vượt quá
            current = current.getParent();
            depth++;
        }
        return depth;
    }

    /** * Xóa mềm các replies (đệ quy) và TRẢ VỀ số lượng đã xóa
     */
    private int deleteRepliesRecursively(Comment parentComment) {
        int deletedCount = 0;
        List<Comment> replies = commentRepository.findByParentId(parentComment.getId());

        for (Comment reply : replies) {
            if (reply.getDeletedAt() == null) {
                // Đệ quy trước để xóa các cháu
                deletedCount += deleteRepliesRecursively(reply);

                // Xóa reply hiện tại
                commentRepository.delete(reply);

                // Xóa mention/reaction của reply
                mentionRepository.softDeleteByCommentId(reply.getId());
                reactionRepository.softDeleteByReactable(ReactableType.COMMENT, reply.getId());

                // Tăng biến đếm (cho reply này)
                deletedCount++;
            }
        }
        return deletedCount;
    }

    /** * Set trạng thái tương tác của user hiện tại cho comment DTO
     */
    private void setInteractionStatusForCurrentUser(CommentResponse commentDto, UUID currentUserId) {
        if (currentUserId == null) {
            commentDto.setCurrentUserReaction(null);
            return;
        }

        // Query ReactionRepository để tìm reaction của user cho COMMENT này
        Optional<Reaction> reaction = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                currentUserId,
                ReactableType.COMMENT,
                commentDto.getId()
        );

        commentDto.setCurrentUserReaction(reaction.map(Reaction::getReactionType).orElse(null));
    }

    /**
     * Lấy author của entity được comment (Content hoặc Answer)
     */
    private User getEntityAuthor(ReactableType type, UUID entityId) {
        return switch (type) {
            case CONTENT -> contentRepository.findById(entityId)
                    .map(Content::getAuthor)
                    .orElse(null);
            case ANSWER -> answerRepository.findById(entityId)
                    .map(Answer::getAuthor)
                    .orElse(null);
            case COMMENT -> null; // Không cần xử lý vì đã có parentComment
        };
    }
}
