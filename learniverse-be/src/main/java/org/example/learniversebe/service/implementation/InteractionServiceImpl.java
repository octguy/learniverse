package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.BookmarkRequest;
import org.example.learniversebe.dto.request.ReactionRequest;
import org.example.learniversebe.dto.request.VoteRequest;
import org.example.learniversebe.dto.response.BookmarkResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.*;
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

@Slf4j
@Service
public class InteractionServiceImpl implements IInteractionService {

    private final VoteRepository voteRepository;
    private final ReactionRepository reactionRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final CommentRepository commentRepository;
    private final ServiceHelper serviceHelper;
    private final BookmarkMapper bookmarkMapper;

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
        log.info("Processing vote for {} with ID: {} of type: {}", request.getVotableType(), request.getVotableId(), request.getVoteType());
        User user = serviceHelper.getCurrentUser();
        VotableType type = request.getVotableType();
        UUID typeId = request.getVotableId();
        VoteType newVoteType = request.getVoteType();

        validateVotableEntity(type, typeId);

        Optional<Vote> existingVoteOpt = voteRepository.findExistingVoteRaw(user.getId(), type, typeId);

        int scoreDelta = 0;

        if (existingVoteOpt.isPresent()) {
            Vote existingVote = existingVoteOpt.get();

            if (existingVote.getDeletedAt() != null) {
                existingVote.setDeletedAt(null);
                existingVote.setVoteType(newVoteType);
                voteRepository.save(existingVote);

                scoreDelta = (newVoteType == VoteType.UPVOTE) ? 1 : -1;
            }
            else {
                if (existingVote.getVoteType() == newVoteType) {
                    voteRepository.delete(existingVote);
                    scoreDelta = (newVoteType == VoteType.UPVOTE) ? -1 : 1;
                } else {
                    existingVote.setVoteType(newVoteType);
                    voteRepository.save(existingVote);
                    scoreDelta = (newVoteType == VoteType.UPVOTE) ? 2 : -2;
                }
            }
        } else {
            Vote newVote = new Vote();
            newVote.setUser(user);
            newVote.setVotableType(type);
            newVote.setVotableId(typeId);
            newVote.setVoteType(newVoteType);
            voteRepository.save(newVote);

            scoreDelta = (newVoteType == VoteType.UPVOTE) ? 1 : -1;
        }

        // Cập nhật điểm số tổng vào bảng cha (Content/Answer)
        return updateVoteScore(type, typeId, scoreDelta);
    }


    @Override
    @Transactional
    public void react(ReactionRequest request) {
        log.info("Processing reaction for {} with ID: {} of type: {}", request.getReactableType(), request.getReactableId(), request.getReactionType());
        User user = serviceHelper.getCurrentUser();
        ReactableType type = request.getReactableType();
        UUID typeId = request.getReactableId();
        ReactionType newReactionType = request.getReactionType();

        validateReactableEntity(type, typeId);

        Optional<Reaction> existingReactionOpt = reactionRepository.findExistingReactionRaw(user.getId(), type, typeId);

        int countDelta = 0;

        if (existingReactionOpt.isPresent()) {
            Reaction existingReaction = existingReactionOpt.get();

            if (existingReaction.getDeletedAt() != null) {
                existingReaction.setDeletedAt(null);
                existingReaction.setReactionType(newReactionType);
                reactionRepository.save(existingReaction);
                countDelta = 1;
            }
            else {
                if (existingReaction.getReactionType() == newReactionType) {
                    reactionRepository.delete(existingReaction);
                    countDelta = -1;
                } else {
                    existingReaction.setReactionType(newReactionType);
                    reactionRepository.save(existingReaction);
                }
            }
        } else {
            Reaction newReaction = new Reaction();
            newReaction.setUser(user);
            newReaction.setReactableType(type);
            newReaction.setReactableId(typeId);
            newReaction.setReactionType(newReactionType);
            reactionRepository.save(newReaction);
            countDelta = 1;
        }

        if (countDelta != 0) {
            updateReactionCount(type, typeId, countDelta);
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

        Optional<Bookmark> existingBookmark = bookmarkRepository.findByUserIdAndContentId(currentUser.getId(), content.getId());

        if (existingBookmark.isPresent()) {
            bookmarkRepository.delete(existingBookmark.get());
            content.setBookmarkCount(Math.max(0, content.getBookmarkCount() - 1));
            contentRepository.save(content);
            return null;
        } else {
            Bookmark bookmark = new Bookmark();
            bookmark.setUser(currentUser);
            bookmark.setContent(content);
            Bookmark saved = bookmarkRepository.save(bookmark);

            content.setBookmarkCount(content.getBookmarkCount() + 1);
            contentRepository.save(content);

            return bookmarkMapper.toBookmarkResponse(saved);
        }
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
            bookmarkPage = bookmarkRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        }

        return bookmarkMapper.bookmarkPageToBookmarkPageResponse(bookmarkPage);
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

    private void validateVotableEntity(VotableType type, UUID id) {
        if (type == VotableType.CONTENT) {
            if (!contentRepository.existsById(id))
                throw new ResourceNotFoundException("Content not found");
        } else if (type == VotableType.ANSWER) {
            if (!answerRepository.existsById(id))
                throw new ResourceNotFoundException("Answer not found");
        }
    }

    private void validateReactableEntity(ReactableType type, UUID id) {
        if (type == ReactableType.CONTENT) {
            if (!contentRepository.existsById(id))
                throw new ResourceNotFoundException("Content not found");
        } else if (type == ReactableType.ANSWER) {
            if (!answerRepository.existsById(id))
                throw new ResourceNotFoundException("Answer not found");
        } else if (type == ReactableType.COMMENT) {
            if (!commentRepository.existsById(id))
                throw new ResourceNotFoundException("Comment not found");
        }
    }

    private int updateVoteScore(VotableType type, UUID id, int delta) {
        if (delta == 0) return 0; // Không có thay đổi

        if (type == VotableType.CONTENT) {
            Content content = contentRepository.findById(id).orElseThrow();
            content.setVoteScore(content.getVoteScore() + delta);
            contentRepository.save(content);
            return content.getVoteScore();
        } else if (type == VotableType.ANSWER) {
            Answer answer = answerRepository.findById(id).orElseThrow();
            answer.setVoteScore(answer.getVoteScore() + delta);
            answerRepository.save(answer);
            return answer.getVoteScore();
        }
        return 0;
    }

    private void updateReactionCount(ReactableType type, UUID id, int delta) {
        if (delta == 0) return;
        if (type == ReactableType.CONTENT) {
            Content content = contentRepository.findById(id).orElseThrow();
            content.setReactionCount(Math.max(0, content.getReactionCount() + delta));
            contentRepository.save(content);
        } else if (type == ReactableType.COMMENT) {
            Comment comment = commentRepository.findById(id).orElseThrow();
            comment.setReactionCount(Math.max(0, comment.getReactionCount() + delta));
            commentRepository.save(comment);
        }
    }
}
