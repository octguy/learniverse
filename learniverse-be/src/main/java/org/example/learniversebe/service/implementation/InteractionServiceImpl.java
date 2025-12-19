package org.example.learniversebe.service.implementation;

import lombok.extern.java.Log;
import org.example.learniversebe.dto.request.BookmarkRequest;
import org.example.learniversebe.dto.request.ReactionRequest;
import org.example.learniversebe.dto.request.VoteRequest;
import org.example.learniversebe.dto.response.BookmarkResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;
import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.BookmarkMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.util.ServiceHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class InteractionServiceImpl implements IInteractionService {

    private final VoteRepository voteRepository;
    private final ReactionRepository reactionRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ContentRepository contentRepository;
    private final AnswerRepository answerRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ServiceHelper serviceHelper;
    private final BookmarkMapper bookmarkMapper;

    private static final Logger log = LoggerFactory.getLogger(InteractionServiceImpl.class);

    public InteractionServiceImpl(VoteRepository voteRepository,
                                  ReactionRepository reactionRepository,
                                  BookmarkRepository bookmarkRepository,
                                  ContentRepository contentRepository,
                                  AnswerRepository answerRepository,
                                  CommentRepository commentRepository,
                                  UserRepository userRepository,
                                  ServiceHelper serviceHelper,
                                  BookmarkMapper bookmarkMapper
    ) {
        this.voteRepository = voteRepository;
        this.reactionRepository = reactionRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.contentRepository = contentRepository;
        this.answerRepository = answerRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.serviceHelper = serviceHelper;
        this.bookmarkMapper = bookmarkMapper;
    }


    @Override
    @Transactional
    public int vote(VoteRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        UUID votableId = request.getVotableId();
        VotableType votableType = request.getVotableType();
        int scoreDelta = 0; // Thay đổi điểm số cuối cùng

        // 1. Tìm entity được vote và kiểm tra điều kiện
        Object votableEntity = findVotableEntity(votableType, votableId);
        UUID authorId = getAuthorIdFromVotable(votableEntity);
        if (currentUser.getId().equals(authorId)) {
            throw new BadRequestException("User cannot vote on their own " + votableType.name().toLowerCase());
        }

        // 2. Tìm vote hiện tại của user (nếu có)
        Optional<Vote> existingVoteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                currentUser.getId(), votableType, votableId);

        if (existingVoteOpt.isPresent()) {
            Vote existingVote = existingVoteOpt.get();
            // 3a. Nếu vote mới cùng loại -> Hủy vote (toggle)
            if (existingVote.getVoteType() == request.getVoteType()) {
                voteRepository.delete(existingVote);
                scoreDelta = (request.getVoteType() == org.example.learniversebe.enums.VoteType.UPVOTE) ? -1 : 1;
            }
            // 3b. Nếu vote mới khác loại -> Cập nhật vote
            else {
                scoreDelta = (request.getVoteType() == org.example.learniversebe.enums.VoteType.UPVOTE) ? 2 : -2; // Từ down->up (+2), từ up->down (-2)
                existingVote.setVoteType(request.getVoteType());
                existingVote.setUpdatedAt(LocalDateTime.now());
                voteRepository.save(existingVote);
            }
        }
        // 4. Nếu chưa có vote -> Tạo vote mới
        else {
            Vote newVote = new Vote();
            newVote.setUser(currentUser);
            newVote.setVotableType(votableType);
            newVote.setVotableId(votableId);
            newVote.setVoteType(request.getVoteType());
            // @PrePersist sẽ set ID và timestamps
            voteRepository.save(newVote);
            scoreDelta = (request.getVoteType() == org.example.learniversebe.enums.VoteType.UPVOTE) ? 1 : -1;
        }

        // 5. Cập nhật vote score trên entity tương ứng
        return updateVoteScore(votableEntity, scoreDelta);
    }


    @Override
    @Transactional
    public void react(ReactionRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        UUID reactableId = request.getReactableId();
        ReactableType reactableType = request.getReactableType();
        int countDelta = 0;

        Object reactableEntity = findReactableEntity(reactableType, reactableId);

        Optional<Reaction> currentReactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                currentUser.getId(), reactableType, reactableId);

        if (currentReactionOpt.isPresent()) {
            Reaction currentReaction = currentReactionOpt.get();
            if (currentReaction.getReactionType() == request.getReactionType()) {
                reactionRepository.delete(currentReaction);
                countDelta = -1;
            }
            else {
                currentReaction.setReactionType(request.getReactionType());
                reactionRepository.save(currentReaction);
            }
        } else {
            Reaction newReaction = new Reaction();
            newReaction.setId(UUID.randomUUID());
            newReaction.setUser(currentUser);
            newReaction.setReactableType(reactableType);
            newReaction.setReactableId(reactableId);
            newReaction.setReactionType(request.getReactionType());

            try {
                reactionRepository.save(newReaction);
                countDelta = 1;
            } catch (DataIntegrityViolationException e) {
                log.warn("Duplicate reaction ignored for user {} on item {}", currentUser.getId(), reactableId);
                return;
            }
        }

        if (countDelta != 0) {
            updateReactionCountManual(reactableEntity, countDelta);
        }
    }

    private void updateReactionCountManual(Object reactableEntity, int countDelta) {
        if (reactableEntity instanceof Content content) {
            int newCount = Math.max(0, content.getReactionCount() + countDelta);
            content.setReactionCount(newCount);
            contentRepository.save(content);
        } else if (reactableEntity instanceof Answer answer) {
            // answer.setReactionCount(...);
            // answerRepository.save(answer);
        } else if (reactableEntity instanceof Comment comment) {
            int newCount = Math.max(0, comment.getReactionCount() + countDelta);
            comment.setReactionCount(newCount);
            commentRepository.save(comment);
        }
    }

    @Override
    @Transactional
    public BookmarkResponse addBookmark(BookmarkRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = contentRepository.findById(request.getContentId())
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + request.getContentId()));

        if (bookmarkRepository.existsByUserIdAndContentId(currentUser.getId(), content.getId())) {
            throw new BadRequestException("Content already bookmarked by this user");
        }

        Bookmark bookmark = new Bookmark();
        bookmark.setUser(currentUser);
        bookmark.setContent(content);
        bookmark.setCollectionName(request.getCollectionName());
        bookmark.setNotes(request.getNotes());
        // @PrePersist sets timestamps and ID

        Bookmark savedBookmark = bookmarkRepository.save(bookmark);

        content.setBookmarkCount(content.getBookmarkCount() + 1);
        contentRepository.save(content);

        return bookmarkMapper.toBookmarkResponse(savedBookmark);
    }

    @Override
    @Transactional
    public void removeBookmark(UUID contentId) {
        User currentUser = serviceHelper.getCurrentUser();
        Bookmark bookmark = bookmarkRepository.findByUserIdAndContentId(currentUser.getId(), contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bookmark not found for user " + currentUser.getId() + " and content " + contentId));

        Content content = bookmark.getContent();

        bookmarkRepository.delete(bookmark);

        if (content != null) {
            content.setBookmarkCount(Math.max(0, content.getBookmarkCount() - 1));
            contentRepository.save(content);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookmarkResponse> getUserBookmarks(String collectionName, Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();
        Page<Bookmark> bookmarkPage;

        if (collectionName != null && !collectionName.isBlank()) {
            bookmarkPage = bookmarkRepository.findByUserIdAndCollectionNameIgnoreCaseOrderByCreatedAtDesc(currentUser.getId(), collectionName, pageable); // Cần method này
        } else {
            bookmarkPage = bookmarkRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable); // Cần method này
        }

        return bookmarkMapper.bookmarkPageToBookmarkPageResponse(bookmarkPage); // Cần hàm tiện ích trong mapper
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isContentBookmarkedByUser(UUID contentId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId == null) {
            return false; // Chưa đăng nhập thì không bookmark
        }
        return bookmarkRepository.existsByUserIdAndContentId(currentUserId, contentId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReactionType getCurrentUserReaction(ReactableType type, UUID reactableId) {
        User currentUser = serviceHelper.getCurrentUser();
        if (currentUser == null) return null;

        return reactionRepository.findByUserIdAndReactableTypeAndReactableId(currentUser.getId(), type, reactableId)
                .map(Reaction::getReactionType)
                .orElse(null);
    }

    // --- Helper Methods ---

    private Object findVotableEntity(VotableType type, UUID id) {
        return switch (type) {
            case CONTENT -> contentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Content (Question) not found: " + id));
            case ANSWER -> answerRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Answer not found: " + id));
            // default -> throw new BadRequestException("Invalid votable type: " + type); // Enum đảm bảo hợp lệ
        };
    }

    private Object findReactableEntity(ReactableType type, UUID id) {
        return switch (type) {
            case CONTENT -> contentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Content not found: " + id));
            case ANSWER -> answerRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Answer not found: " + id));
            case COMMENT -> commentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
            // default -> throw new BadRequestException("Invalid reactable type: " + type);
        };
    }

    private UUID getAuthorIdFromVotable(Object entity) {
        if (entity instanceof Content content) {
            return content.getAuthor().getId();
        } else if (entity instanceof Answer answer) {
            return answer.getAuthor().getId();
        }
        throw new IllegalArgumentException("Unsupported votable entity type");
    }

    private int updateVoteScore(Object entity, int delta) {
        if (entity instanceof Content content) {
            content.setVoteScore(content.getVoteScore() + delta);
            // Có thể cập nhật upvote/downvote count nếu cần
            contentRepository.save(content);
            return content.getVoteScore();
        } else if (entity instanceof Answer answer) {
            answer.setVoteScore(answer.getVoteScore() + delta);
            // Có thể cập nhật upvote/downvote count nếu cần
            answerRepository.save(answer);
            return answer.getVoteScore();
        }
        throw new IllegalArgumentException("Unsupported votable entity type");
    }

    private void updateReactionCount(Object entity, int delta) {
        if (entity instanceof Content content) {
            content.setReactionCount(Math.max(0, content.getReactionCount() + delta));
            contentRepository.save(content);
        } else if (entity instanceof Answer answer) {
            // Cần thêm reactionCount vào Answer entity nếu muốn track
            // answer.setReactionCount(Math.max(0, answer.getReactionCount() + delta));
            // answerRepository.save(answer);
        } else if (entity instanceof Comment comment) {
            comment.setReactionCount(Math.max(0, comment.getReactionCount() + delta));
            commentRepository.save(comment);
        } else {
            throw new IllegalArgumentException("Unsupported reactable entity type");
        }
    }
}
