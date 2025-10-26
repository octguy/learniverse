package org.example.learniversebe.service.implementation;

import org.example.learniversebe.dto.request.CreateQuestionRequest;
import org.example.learniversebe.dto.request.UpdateQuestionRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.AnswerMapper;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.model.composite_key.ContentTagId;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.service.IQuestionService;
import org.example.learniversebe.util.ServiceHelper;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements IQuestionService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final ContentTagRepository contentTagRepository;
    private final AnswerRepository answerRepository; // Cần để kiểm tra accepted answer
    private final ContentEditHistoryRepository editHistoryRepository;
    private final ContentMapper contentMapper;
    private final AnswerMapper answerMapper; // Cần để map page answer
    private final ServiceHelper serviceHelper;
    private final SlugGenerator slugGenerator;
    private final IInteractionService interactionService; // Cần để lấy trạng thái tương tác
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final VoteRepository voteRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ShareRepository shareRepository;

    @Value("${app.content.edit.limit-hours:24}")
    private long editLimitHours;


    public QuestionServiceImpl(ContentRepository contentRepository,
                               UserRepository userRepository,
                               TagRepository tagRepository,
                               ContentTagRepository contentTagRepository,
                               AnswerRepository answerRepository, // Inject
                               ContentEditHistoryRepository editHistoryRepository,
                               ContentMapper contentMapper,
                               AnswerMapper answerMapper, // Inject
                               ServiceHelper serviceHelper,
                               SlugGenerator slugGenerator,
                               IInteractionService interactionService,
                               CommentRepository commentRepository,
                               ReactionRepository reactionRepository,
                               VoteRepository voteRepository,
                               BookmarkRepository bookmarkRepository,
                               ShareRepository shareRepository // Inject
    ) {
        this.contentRepository = contentRepository;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.contentTagRepository = contentTagRepository;
        this.answerRepository = answerRepository;
        this.editHistoryRepository = editHistoryRepository;
        this.contentMapper = contentMapper;
        this.answerMapper = answerMapper;
        this.serviceHelper = serviceHelper;
        this.slugGenerator = slugGenerator;
        this.interactionService = interactionService;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.voteRepository = voteRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.shareRepository = shareRepository;
    }


    @Override
    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest request) {
        User author = serviceHelper.getCurrentUser();

        // Map DTO sang Entity (dùng mapper cho Question)
        Content content = contentMapper.createQuestionRequestToContent(request);
        content.setAuthor(author);
        content.setContentType(ContentType.QUESTION); // Đảm bảo đúng type
        content.setStatus(ContentStatus.PUBLISHED);
        content.setPublishedAt(LocalDateTime.now());
        content.setSlug(slugGenerator.generateSlug(request.getTitle())); // Slug cho question dựa vào title

        // Lưu Content trước
        Content savedContent = contentRepository.save(content);

        // Xử lý Tags (tương tự Post)
        associateTags(savedContent, request.getTagIds());

        // Map lại sang Response DTO
        QuestionResponse response = contentMapper.contentToQuestionResponse(savedContent);
        // Set trạng thái tương tác ban đầu
        response.setBookmarkedByCurrentUser(false);
        response.setCurrentUserReaction(null);
        // response.setCurrentUserVote(null); // Vote cần logic riêng

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> getAllQuestions(Pageable pageable) {
        // Có thể cần thêm điều kiện status = PUBLISHED
        Page<Content> questionPage = contentRepository.findByContentType(ContentType.QUESTION, pageable);
        return contentMapper.contentPageToQuestionSummaryPage(questionPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> getQuestionsByAuthor(UUID authorId, Pageable pageable) {
        if (!userRepository.existsById(authorId)) {
            throw new ResourceNotFoundException("Author not found with id: " + authorId);
        }
        Page<Content> questionPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(
                authorId, ContentType.QUESTION, ContentStatus.PUBLISHED, pageable);
        return contentMapper.contentPageToQuestionSummaryPage(questionPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> getQuestionsByTag(UUID tagId, Pageable pageable) {
        if (!tagRepository.existsById(tagId)) {
            throw new ResourceNotFoundException("Tag not found with id: " + tagId);
        }
        // Cần phương thức trong ContentRepository để tìm theo tagId (JOIN với content_tag)
        Page<Content> questionPage = contentRepository.findPublishedQuestionsByTagId(tagId, pageable);
        return contentMapper.contentPageToQuestionSummaryPage(questionPage);
    }

    @Override
    @Transactional // Cần update view count
    public QuestionResponse getQuestionById(UUID questionId, Pageable answerPageable) {
        Content content = findQuestionByIdOrFail(questionId);

        // Tăng view count
        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        // Map sang DTO chi tiết
        QuestionResponse response = contentMapper.contentToQuestionResponse(content);

        // Lấy trạng thái tương tác của user hiện tại
        setInteractionStatusForCurrentUser(response, content.getId());

        // Lấy danh sách câu trả lời phân trang
        Page<Answer> answerPage = answerRepository.findByQuestionIdOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(questionId, answerPageable);
        PageResponse<AnswerResponse> answerPageResponse = answerMapper.answerPageToAnswerPageResponse(answerPage);
        // Gán vào response (hoặc client tự gọi API lấy answer riêng)
        response.setAnswers(answerPageResponse.getContent()); // Chỉ gán content của trang answer vào response chính

        return response;
    }

    @Override
    @Transactional
    public QuestionResponse getQuestionBySlug(String slug, Pageable answerPageable) {
        Content content = contentRepository.findBySlugAndContentTypeAndStatus(slug, ContentType.QUESTION, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with slug: " + slug));

        // Tăng view count
        content.setViewCount(content.getViewCount() + 1);
        contentRepository.save(content);

        QuestionResponse response = contentMapper.contentToQuestionResponse(content);

        // Lấy trạng thái tương tác
        setInteractionStatusForCurrentUser(response, content.getId());

        // Lấy danh sách câu trả lời phân trang
        Page<Answer> answerPage = answerRepository.findByQuestionIdOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(content.getId(), answerPageable);
        PageResponse<AnswerResponse> answerPageResponse = answerMapper.answerPageToAnswerPageResponse(answerPage);
        response.setAnswers(answerPageResponse.getContent());

        return response;
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = findQuestionByIdOrFail(questionId);

        // Kiểm tra quyền sở hữu và thời gian sửa
        serviceHelper.ensureCurrentUserIsAuthor(content.getAuthor().getId(), "update question");
        checkEditTimeLimit(content);

        // Lưu lịch sử
        saveEditHistory(content, currentUser, request.getEditReason());

        // Cập nhật
        boolean titleChanged = !request.getTitle().equals(content.getTitle());
        content.setTitle(request.getTitle());
        content.setBody(request.getBody());
        if (titleChanged) {
            content.setSlug(slugGenerator.generateSlug(request.getTitle()));
        }

        // Cập nhật Tags
        updateTags(content, request.getTagIds());

        Content updatedContent = contentRepository.save(content);

        // Map và trả về (không cần lấy lại answer page)
        QuestionResponse response = contentMapper.contentToQuestionResponse(updatedContent);
        setInteractionStatusForCurrentUser(response, updatedContent.getId());
        return response;
    }


    @Override
    @Transactional
    public void deleteQuestion(UUID questionId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content content = findQuestionByIdOrFail(questionId);

        // Kiểm tra quyền
        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId()) /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this question");
        }

        // 1. Soft delete Question (Content)
        contentRepository.delete(content);

        // 2. Xóa mềm các thành phần liên quan

        // Xóa mềm ContentTags
        contentTagRepository.deleteByContentId(questionId);

        // Xóa mềm Answers (và các dữ liệu liên quan của Answer)
        // Lấy tất cả Answer IDs thuộc Question này
        List<UUID> answerIds = answerRepository.findAllIdsByQuestionId(questionId);
        for (UUID answerId : answerIds) {
            // Gọi hàm deleteAnswer của AnswerService (nếu có thể) hoặc xóa trực tiếp
            // Xóa thủ công để tránh vòng lặp service
            answerRepository.softDeleteById(answerId);
            commentRepository.softDeleteByCommentable(ReactableType.ANSWER, answerId);
            reactionRepository.softDeleteByReactable(ReactableType.ANSWER, answerId);
            voteRepository.softDeleteByVotable(VotableType.ANSWER, answerId);
        }

        // Xóa mềm Comments (trực tiếp trên Question)
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, questionId);

        // Xóa mềm Reactions (trực tiếp trên Question)
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, questionId);

        // Xóa mềm Votes (trực tiếp trên Question)
        voteRepository.softDeleteByVotable(VotableType.CONTENT, questionId);

        // Xóa mềm Bookmarks
        bookmarkRepository.softDeleteByContentId(questionId);

        // Xóa mềm Shares
        shareRepository.softDeleteByContentId(questionId);
    }

    @Override
    @Transactional
    public void markAnswerAsAccepted(UUID questionId, UUID answerId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content question = findQuestionByIdOrFail(questionId);

        // Chỉ tác giả câu hỏi mới được accept
        serviceHelper.ensureCurrentUserIsAuthor(question.getAuthor().getId(), "accept answer");

        Answer answerToAccept = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));

        // Kiểm tra câu trả lời có thuộc câu hỏi này không
        if (!answerToAccept.getQuestion().getId().equals(questionId)) {
            throw new BadRequestException("Answer does not belong to this question");
        }

        // Nếu đã có câu trả lời khác được accept, bỏ accept nó đi
        if (question.getAcceptedAnswer() != null && !question.getAcceptedAnswer().getId().equals(answerId)) {
            Answer previousAccepted = question.getAcceptedAnswer();
            previousAccepted.setIsAccepted(false);
            answerRepository.save(previousAccepted);
        }

        // Accept câu trả lời mới
        answerToAccept.setIsAccepted(true);
        question.setAcceptedAnswer(answerToAccept);
        question.setIsAnswered(true);

        answerRepository.save(answerToAccept);
        contentRepository.save(question);

        // TODO: Gửi notification cho người trả lời
    }

    @Override
    @Transactional
    public void unmarkAnswerAsAccepted(UUID questionId, UUID answerId) {
        User currentUser = serviceHelper.getCurrentUser();
        Content question = findQuestionByIdOrFail(questionId);

        // Chỉ tác giả câu hỏi mới được un-accept
        serviceHelper.ensureCurrentUserIsAuthor(question.getAuthor().getId(), "unaccept answer");

        // Kiểm tra xem đây có đúng là answer đang được accept không
        if (question.getAcceptedAnswer() == null || !question.getAcceptedAnswer().getId().equals(answerId)) {
            throw new ResourceNotFoundException("Answer with id " + answerId + " is not the accepted answer for this question");
        }

        Answer answerToUnaccept = question.getAcceptedAnswer();
        answerToUnaccept.setIsAccepted(false);
        question.setAcceptedAnswer(null);
        question.setIsAnswered(false); // Hoặc kiểm tra xem còn answer nào khác không nếu logic phức tạp hơn

        answerRepository.save(answerToUnaccept);
        contentRepository.save(question);
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> searchQuestions(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return PageResponse.<QuestionSummaryResponse>builder().content(List.of()).build();
        }
        Page<Content> questionPage = contentRepository.searchPublishedQuestions(query, pageable);
        return contentMapper.contentPageToQuestionSummaryPage(questionPage);
    }

    // --- Helper Methods ---

    private Content findQuestionByIdOrFail(UUID questionId) {
        return contentRepository.findByIdAndContentType(questionId, ContentType.QUESTION)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
    }

    private void associateTags(Content content, Set<UUID> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            throw new BadRequestException("At least one tag is required for a question.");
        }
        // Tương tự PostServiceImpl
        List<Tag> tags = tagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
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
            contentTag.setContentTagId(new ContentTagId(content.getId(), tag.getId()));
            contentTag.setCreatedAt(now);
            contentTags.add(contentTag);
        }
        contentTagRepository.saveAll(contentTags);
        content.setContentTags(contentTags);
    }

    private void updateTags(Content content, Set<UUID> newTagIds) {
        if (newTagIds == null || newTagIds.isEmpty()) {
            throw new BadRequestException("At least one tag is required for a question.");
        }
        // Xóa liên kết cũ
        contentTagRepository.deleteAll(content.getContentTags());
        content.getContentTags().clear();
        // Thêm liên kết mới
        associateTags(content, newTagIds);
    }


    private void checkEditTimeLimit(Content content) {
        if (content.getPublishedAt() != null &&
                LocalDateTime.now().isAfter(content.getPublishedAt().plusHours(editLimitHours))) {
            throw new BadRequestException("Edit time limit exceeded (" + editLimitHours + " hours)");
        }
    }

    private void saveEditHistory(Content content, User editor, String reason) {
        ContentEditHistory history = new ContentEditHistory();
        history.setContent(content);
        history.setEditedBy(editor);
        history.setPreviousTitle(content.getTitle());
        history.setPreviousBody(content.getBody());
        history.setEditReason(reason);
        // editedAt được set bởi @PrePersist
        editHistoryRepository.save(history);
    }

    /**
     * Helper to set user-specific interaction status on a QuestionResponse DTO.
     */
    private void setInteractionStatusForCurrentUser(QuestionResponse response, UUID id) {
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            UUID questionId = response.getId();
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(questionId));

            // Lấy vote hiện tại
            Optional<Vote> voteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                    currentUserId, VotableType.CONTENT, questionId);
            response.setCurrentUserVote(voteOpt.map(Vote::getVoteType).orElse(null)); // <<< ĐÃ HOÀN THIỆN

            // Lấy reaction hiện tại
            Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                    currentUserId, ReactableType.CONTENT, questionId);
            response.setCurrentUserReaction(reactionOpt.map(Reaction::getReactionType).orElse(null));
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserVote(null);
            response.setCurrentUserReaction(null);
        }
    }
}
