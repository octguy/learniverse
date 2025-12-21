package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateCommentRequest;
import org.example.learniversebe.dto.request.UpdateCommentRequest;
import org.example.learniversebe.dto.response.CommentResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.CommentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.ICommentService;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
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
    private final IInteractionService interactionService; // Inject InteractionService
    // private final INotificationService notificationService;

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
                              @Lazy IInteractionService interactionService
            /*, INotificationService notificationService */) {
        this.commentRepository = commentRepository;
        this.contentRepository = contentRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.mentionRepository = mentionRepository;
        this.commentMapper = commentMapper;
        this.serviceHelper = serviceHelper;
        this.interactionService = interactionService;
        // this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public CommentResponse addComment(CreateCommentRequest request) {
        log.info("Adding comment to {} with ID: {}", request.getCommentableType(), request.getCommentableId());
        User author = serviceHelper.getCurrentUser();
        Comment parentComment = null;
        int depth = 0;

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
                    !parentComment.getCommentableType().equals(request.getCommentableType().name())) {
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

        // 6. Gửi Notifications (tạm bỏ qua)
        // notificationService.notifyNewComment(...)
        // notificationService.notifyMentionedUsers(...)

        // 7. Map sang Response DTO
        CommentResponse response = commentMapper.commentToCommentResponse(savedComment);
        // Set trạng thái tương tác ban đầu
        setInteractionStatusForCurrentUser(response, author.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getCommentsFor(ReactableType commentableType, UUID commentableId, Pageable pageable) {
        validateCommentableEntity(commentableType, commentableId); // Đảm bảo entity tồn tại

        Page<Comment> commentPage = commentRepository.findByCommentableTypeAndCommentableIdAndParentIsNullOrderByCreatedAtAsc(
                commentableType.name(), commentableId, pageable);

        PageResponse<CommentResponse> responsePage = commentMapper.commentPageToCommentPageResponse(commentPage);

        // Lấy trạng thái tương tác cho từng comment
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && responsePage != null && responsePage.getContent() != null) {
            responsePage.getContent().forEach(commentDto -> setInteractionStatusForCurrentUser(commentDto, currentUserId));
        }
        return responsePage;
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

        // Kiểm tra quyền (tác giả hoặc admin/mod)
        if (!comment.getAuthor().getId().equals(currentUser.getId()) /* && !currentUser.isAdminOrModerator() */) {
            throw new UnauthorizedException("User is not authorized to delete this comment");
        }

        // Giảm count trên parent entity hoặc parent comment
        updateCommentableCommentCount(ReactableType.valueOf(comment.getCommentableType()), comment.getCommentableId(), -1);
        if (comment.getParent() != null) {
            Comment parent = comment.getParent();
            parent.setReplyCount(Math.max(0, parent.getReplyCount() - 1));
            commentRepository.save(parent);
        }

        // Xóa mềm comment (và các replies nếu cần - logic phức tạp hơn)
        // Hiện tại chỉ xóa mềm comment này
        commentRepository.delete(comment);

        // TODO: Xóa mềm các Mention, Reaction liên quan
        mentionRepository.softDeleteByCommentId(commentId); // Cần thêm method này vào Repo
        // reactionRepository.softDeleteByReactable(ReactableType.COMMENT, commentId); // Cần thêm method này

        // Xử lý xóa replies (ví dụ: xóa mềm luôn)
        deleteRepliesRecursively(comment);
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

    /** Xóa mềm các replies (đệ quy) */
    private void deleteRepliesRecursively(Comment parentComment) {
        List<Comment> replies = commentRepository.findByParentId(parentComment.getId()); // Cần method này trong Repo
        for (Comment reply : replies) {
            if (reply.getDeletedAt() == null) { // Chỉ xóa nếu chưa bị xóa
                deleteRepliesRecursively(reply); // Xóa con của nó trước
                commentRepository.delete(reply); // Xóa mềm reply này
                // TODO: Xóa mềm Mention, Reaction của reply
                mentionRepository.softDeleteByCommentId(reply.getId());
            }
        }
    }


    /** Set trạng thái tương tác của user hiện tại cho comment DTO */
    private void setInteractionStatusForCurrentUser(CommentResponse commentDto, UUID currentUserId) {
        // TODO: Implement logic to query ReactionRepository
        // Reaction reaction = reactionRepository.findByReactableTypeAndReactableIdAndUserId(ReactableType.COMMENT, commentDto.getId(), currentUserId).orElse(null);
        // commentDto.setCurrentUserReaction(reaction != null ? reaction.getReactionType() : null);

        // Placeholder:
        // commentDto.setCurrentUserReaction(null);
    }
}
