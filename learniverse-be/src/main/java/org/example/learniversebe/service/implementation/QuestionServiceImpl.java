package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateQuestionRequest;
import org.example.learniversebe.dto.request.UpdateQuestionRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.AnswerMapper;
import org.example.learniversebe.mapper.ContentMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.service.INotificationService;
import org.example.learniversebe.service.IQuestionService;
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

@Slf4j
@Service
public class QuestionServiceImpl implements IQuestionService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final ContentTagRepository contentTagRepository;
    private final AnswerRepository answerRepository;
    private final ContentEditHistoryRepository editHistoryRepository;
    private final ContentMapper contentMapper;
    private final AnswerMapper answerMapper;
    private final ServiceHelper serviceHelper;
    private final SlugGenerator slugGenerator;
    private final IInteractionService interactionService;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final VoteRepository voteRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ShareRepository shareRepository;
    private final IStorageService storageService;
    private final AttachmentRepository attachmentRepository;
    private final INotificationService notificationService;


    @Value("${app.content.edit.limit-hours:24}")
    private long editLimitHours;


    public QuestionServiceImpl(ContentRepository contentRepository,
                               UserRepository userRepository,
                               TagRepository tagRepository,
                               ContentTagRepository contentTagRepository,
                               AnswerRepository answerRepository,
                               ContentEditHistoryRepository editHistoryRepository,
                               ContentMapper contentMapper,
                               AnswerMapper answerMapper,
                               ServiceHelper serviceHelper,
                               SlugGenerator slugGenerator,
                               IInteractionService interactionService,
                               CommentRepository commentRepository,
                               ReactionRepository reactionRepository,
                               VoteRepository voteRepository,
                               BookmarkRepository bookmarkRepository,
                               ShareRepository shareRepository,
                               IStorageService storageService,
                               AttachmentRepository attachmentRepository,
                               INotificationService notificationService
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
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
        this.notificationService = notificationService;
    }


    @Override
    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest request, List<MultipartFile> files) {
        log.info("Creating question with title: {}", request.getTitle());
        User author = serviceHelper.getCurrentUser();

        Content content = contentMapper.createQuestionRequestToContent(request);
        content.setAuthor(author);
        content.setContentType(ContentType.QUESTION);

        content.setStatus(request.getStatus() != null ? request.getStatus() : ContentStatus.PUBLISHED);
        if (content.getStatus() == ContentStatus.PUBLISHED) {
            content.setPublishedAt(LocalDateTime.now());
        }

        content.setSlug(slugGenerator.generateSlug(request.getTitle()));

        associateTags(content, request.getTagIds());
        Content savedContent = contentRepository.save(content);
        log.info("Question created successfully with ID: {} and slug: {} by user: {}", savedContent.getId(), savedContent.getSlug(), author.getUsername());

        if (files != null && !files.isEmpty()) {
            List<Attachment> attachments = new ArrayList<>();
            for (MultipartFile file : files) {
                try {
                    Map<String, String> uploadResult = storageService.uploadFile(file);

                    Attachment attachment = new Attachment();
                    attachment.setContent(savedContent); // Link to Question
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

        return getQuestionResponseWithInteraction(savedContent);
    }

    @Override
    @Transactional
    public QuestionResponse publishQuestion(UUID questionId) {
        User currentUser = serviceHelper.getCurrentUser();

        Content content = contentRepository.findByIdAndContentType(questionId, ContentType.QUESTION)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!content.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Not authorized to publish this question");
        }

        if (content.getStatus() == ContentStatus.PUBLISHED) {
            throw new BadRequestException("Question is already published");
        }

        content.setStatus(ContentStatus.PUBLISHED);
        content.setPublishedAt(LocalDateTime.now());
        Content saved = contentRepository.save(content);
        return getQuestionResponseWithInteraction(saved);
    }

    // Add method publishQuestion implementation (Similar to PostServiceImpl)
    private AttachmentType determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) return AttachmentType.IMAGE;
        if (mimeType.equals("application/pdf")) return AttachmentType.PDF;
        return AttachmentType.OTHER;
    }

    private QuestionResponse getQuestionResponseWithInteraction(Content content) {
        QuestionResponse response = contentMapper.contentToQuestionResponse(content);
        setInteractionStatusForCurrentUser(response, content.getId()); // Helper method already exists in your file
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> getAllQuestions(String answerFilter, List<UUID> tagIds, String query, Pageable pageable) {
        Page<Content> page;
        
        boolean hasQuery = query != null && !query.isBlank();
        boolean hasTagFilter = tagIds != null && !tagIds.isEmpty();
        
        // Determine which repository method to call based on filters
        if (hasQuery) {
            // Search with optional answer filter
            if ("unanswered".equalsIgnoreCase(answerFilter)) {
                page = contentRepository.searchUnansweredQuestions(query.trim(), pageable);
            } else if ("answered".equalsIgnoreCase(answerFilter)) {
                page = contentRepository.searchAnsweredQuestions(query.trim(), pageable);
            } else if ("accepted".equalsIgnoreCase(answerFilter)) {
                page = contentRepository.searchAcceptedQuestions(query.trim(), pageable);
            } else {
                page = contentRepository.searchPublishedQuestions(query.trim(), pageable);
            }
        } else if (hasTagFilter) {
            // Filter by tags
            page = contentRepository.findPublishedQuestionsByTagIds(tagIds, pageable);
        } else if ("unanswered".equalsIgnoreCase(answerFilter)) {
            page = contentRepository.findUnansweredQuestions(pageable);
        } else if ("answered".equalsIgnoreCase(answerFilter)) {
            page = contentRepository.findAnsweredQuestions(pageable);
        } else if ("accepted".equalsIgnoreCase(answerFilter)) {
            page = contentRepository.findAcceptedQuestions(pageable);
        } else {
            // No filters - get all published questions
            page = contentRepository.findByContentTypeAndStatus(
                    ContentType.QUESTION, ContentStatus.PUBLISHED, pageable);
        }

        PageResponse<QuestionSummaryResponse> response = contentMapper.contentPageToQuestionSummaryPage(page);

        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && response.getContent() != null) {
            for (QuestionSummaryResponse question : response.getContent()) {
                question.setBookmarkedByCurrentUser(
                        interactionService.isContentBookmarkedByUser(question.getId())
                );

                Optional<Vote> voteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                        currentUserId, VotableType.CONTENT, question.getId());
                question.setCurrentUserVote(voteOpt.map(Vote::getVoteType).orElse(null));

                Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                        currentUserId, ReactableType.CONTENT, question.getId());
                question.setCurrentUserReaction(reactionOpt.map(Reaction::getReactionType).orElse(null));
            }
        }
        return response;
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
    @Transactional(readOnly = true)
    public PageResponse<QuestionSummaryResponse> getMyQuestions(ContentStatus status, Pageable pageable) {
        User currentUser = serviceHelper.getCurrentUser();

        ContentStatus searchStatus = (status != null) ? status : ContentStatus.PUBLISHED;

        Page<Content> questionPage;

        if (searchStatus == ContentStatus.DRAFT || searchStatus == ContentStatus.ARCHIVED) {
            questionPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByUpdatedAtDesc(
                    currentUser.getId(),
                    ContentType.QUESTION,
                    searchStatus,
                    pageable
            );
        } else {
            questionPage = contentRepository.findByAuthorIdAndContentTypeAndStatusOrderByPublishedAtDesc(
                    currentUser.getId(),
                    ContentType.QUESTION,
                    searchStatus,
                    pageable
            );
        }

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
        // Set interaction status for each answer
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && answerPageResponse.getContent() != null) {
            answerPageResponse.getContent().forEach(answerDto -> setAnswerInteractionStatus(answerDto, currentUserId));
        }
        response.setAnswers(answerPageResponse.getContent());

        return response;
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest request, List<MultipartFile> files) {
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
        content.setLastEditedAt(LocalDateTime.now());
        if (titleChanged) {
            content.setSlug(slugGenerator.generateSlug(request.getTitle()));
        }

        // Cập nhật Tags
        updateTags(content, request.getTagIds());

        // Remove attachments if requested
        if (request.getRemoveMediaIds() != null && !request.getRemoveMediaIds().isEmpty()) {
            for (UUID attachmentId : request.getRemoveMediaIds()) {
                Attachment attachment = attachmentRepository.findById(attachmentId).orElse(null);
                if (attachment != null && attachment.getContent().getId().equals(questionId)) {
                    // Delete from cloud storage
                    if (attachment.getStorageKey() != null) {
                        try {
                            storageService.deleteFile(attachment.getStorageKey());
                        } catch (IOException e) {
                            log.warn("Failed to delete file from storage: {}", attachment.getStorageKey(), e);
                            // Continue with database deletion even if cloud deletion fails
                        }
                    }
                    // Remove from question and delete from database
                    content.getAttachments().remove(attachment);
                    attachmentRepository.delete(attachment);
                }
            }
        }

        // Add new attachments if provided
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

        // Map và trả về (không cần lấy lại answer page)
        QuestionResponse response = contentMapper.contentToQuestionResponse(updatedContent);
        setInteractionStatusForCurrentUser(response, updatedContent.getId());
        return response;
    }


    @Override
    @Transactional
    public void deleteQuestion(UUID questionId) {
        Content content = findQuestionByIdOrFail(questionId);

        if (!serviceHelper.isCurrentUserAuthor(content.getAuthor().getId()) /* && !serviceHelper.isCurrentUserAdminOrModerator() */ ) {
            throw new UnauthorizedException("User is not authorized to delete this question");
        }

        // Delete related answers first
        List<UUID> answerIds = answerRepository.findAllIdsByQuestionId(questionId);
        for (UUID answerId : answerIds) {
            commentRepository.softDeleteByCommentable(ReactableType.ANSWER, answerId);
            reactionRepository.softDeleteByReactable(ReactableType.ANSWER, answerId);
            voteRepository.softDeleteByVotable(VotableType.ANSWER, answerId);
            answerRepository.softDeleteById(answerId);
        }
        
        // Delete question-related interactions
        commentRepository.softDeleteByCommentable(ReactableType.CONTENT, questionId);
        reactionRepository.softDeleteByReactable(ReactableType.CONTENT, questionId);
        voteRepository.softDeleteByVotable(VotableType.CONTENT, questionId);
        bookmarkRepository.softDeleteByContentId(questionId);
        shareRepository.softDeleteByContentId(questionId);
        
        // Delete content tags
        contentTagRepository.deleteByContentId(questionId);
        
        // Finally delete the question content (soft delete via @SQLDelete)
        contentRepository.delete(content);
    }

    @Override
    @Transactional
    public void markAnswerAsAccepted(UUID questionId, UUID answerId) {
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

        if (!answerToAccept.getAuthor().getId().equals(question.getAuthor().getId())) {
            notificationService.notifyAnswerAccepted(
                    answerToAccept.getAuthor(),
                    question.getAuthor(),
                    answerToAccept
            );
        }
    }

    @Override
    @Transactional
    public void unmarkAnswerAsAccepted(UUID questionId, UUID answerId) {
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
//            contentTag.setContentTagId(new ContentTagId(content.getId(), tag.getId()));
            contentTag.setCreatedAt(now);
            contentTags.add(contentTag);
        }
//        contentTagRepository.saveAll(contentTags);
        content.setContentTags(contentTags);
    }

    private void updateTags(Content content, Set<UUID> newTagIds) {
        if (newTagIds == null || newTagIds.isEmpty()) {
            throw new BadRequestException("At least one tag is required for a question.");
        }
        
        // Get current tag IDs
        Set<UUID> currentTagIds = content.getContentTags().stream()
                .map(ct -> ct.getTag().getId())
                .collect(Collectors.toSet());
        
        // If tags are the same, no need to update
        if (currentTagIds.equals(newTagIds)) {
            return;
        }
        
        // Find tags to remove and tags to add
        Set<UUID> tagsToRemove = currentTagIds.stream()
                .filter(id -> !newTagIds.contains(id))
                .collect(Collectors.toSet());
        
        Set<UUID> tagsToAdd = newTagIds.stream()
                .filter(id -> !currentTagIds.contains(id))
                .collect(Collectors.toSet());
        
        // Remove old content tags
        if (!tagsToRemove.isEmpty()) {
            content.getContentTags().removeIf(ct -> tagsToRemove.contains(ct.getTag().getId()));
            contentTagRepository.deleteByContentIdAndTagIds(content.getId(), tagsToRemove);
            contentTagRepository.flush(); // Ensure deletes are persisted before adding
        }
        
        // Add new tags
        if (!tagsToAdd.isEmpty()) {
            List<Tag> newTags = tagRepository.findAllById(tagsToAdd);
            if (newTags.size() != tagsToAdd.size()) {
                Set<UUID> foundIds = newTags.stream().map(Tag::getId).collect(Collectors.toSet());
                Set<UUID> notFoundIds = tagsToAdd.stream().filter(id -> !foundIds.contains(id)).collect(Collectors.toSet());
                throw new BadRequestException("Tags not found with IDs: " + notFoundIds);
            }
            
            LocalDateTime now = LocalDateTime.now();
            for (Tag tag : newTags) {
                ContentTag contentTag = new ContentTag();
                contentTag.setContent(content);
                contentTag.setTag(tag);
                contentTag.setCreatedAt(now);
                content.getContentTags().add(contentTag);
            }
        }
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
        // Set default edit reason if null to avoid NOT NULL constraint violation
        history.setEditReason(reason != null && !reason.isBlank() ? reason : "Chỉnh sửa nội dung");
        // editedAt được set bởi @PrePersist
        editHistoryRepository.save(history);
    }

    /**
     * Helper to set user-specific interaction status on a QuestionResponse DTO.
     */
    private void setInteractionStatusForCurrentUser(QuestionResponse response, UUID questionId) {
        UUID currentUserId = serviceHelper.getCurrentUserId();

        if (currentUserId != null) {
            response.setBookmarkedByCurrentUser(interactionService.isContentBookmarkedByUser(questionId));

            Optional<Vote> voteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                    currentUserId, VotableType.CONTENT, questionId);
            response.setCurrentUserVote(voteOpt.map(Vote::getVoteType).orElse(null));

            Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                    currentUserId, ReactableType.CONTENT, questionId);
            response.setCurrentUserReaction(reactionOpt.map(Reaction::getReactionType).orElse(null));
        } else {
            response.setBookmarkedByCurrentUser(false);
            response.setCurrentUserVote(null);
            response.setCurrentUserReaction(null);
        }
    }

    @Override
    @Transactional
    public QuestionResponse addAttachments(UUID questionId, List<MultipartFile> files) {
        User currentUser = serviceHelper.getCurrentUser();
        Content question = findQuestionByIdOrFail(questionId);
        
        serviceHelper.ensureCurrentUserIsAuthor(question.getAuthor().getId(), "add attachments to question");
        
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files provided");
        }
        
        List<Attachment> attachments = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                Map<String, String> uploadResult = storageService.uploadFile(file);
                
                Attachment attachment = new Attachment();
                attachment.setContent(question);
                attachment.setUploadedBy(currentUser);
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
        question.getAttachments().addAll(attachments);
        
        return getQuestionResponseWithInteraction(question);
    }

    @Override
    @Transactional
    public void removeAttachment(UUID questionId, UUID attachmentId) {
        Content question = findQuestionByIdOrFail(questionId);
        serviceHelper.ensureCurrentUserIsAuthor(question.getAuthor().getId(), "remove attachment from question");
        
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + attachmentId));
        
        if (!attachment.getContent().getId().equals(questionId)) {
            throw new BadRequestException("Attachment does not belong to this question");
        }
        
        // Delete from cloud storage
        if (attachment.getStorageKey() != null) {
            try {
                storageService.deleteFile(attachment.getStorageKey());
            } catch (IOException e) {
                log.warn("Failed to delete file from storage: {}", attachment.getStorageKey(), e);
                // Continue with database deletion even if cloud deletion fails
            }
        }
        
        // Remove from question and delete from database
        question.getAttachments().remove(attachment);
        attachmentRepository.delete(attachment);
    }

    /**
     * Helper to set user-specific interaction status on an AnswerResponse DTO.
     */
    private void setAnswerInteractionStatus(AnswerResponse answerDto, UUID currentUserId) {
        if (currentUserId == null) return;

        Optional<Vote> voteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                currentUserId, VotableType.ANSWER, answerDto.getId());
        answerDto.setCurrentUserVote(voteOpt.map(Vote::getVoteType).orElse(null));

        Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                currentUserId, ReactableType.ANSWER, answerDto.getId());
        answerDto.setCurrentUserReaction(reactionOpt.map(Reaction::getReactionType).orElse(null));
    }

}
