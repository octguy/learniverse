package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateAnswerRequest;
import org.example.learniversebe.dto.request.UpdateAnswerRequest;
import org.example.learniversebe.dto.response.AnswerResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.VotableType;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.mapper.AnswerMapper;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.service.IAnswerService;
import org.example.learniversebe.service.IInteractionService;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class AnswerServiceImpl implements IAnswerService {

    private final AnswerRepository answerRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final AnswerMapper answerMapper;
    private final ServiceHelper serviceHelper;
    private final IInteractionService interactionService;
    // private final INotificationService notificationService;
    private final VoteRepository voteRepository;
    private final ReactionRepository reactionRepository;

    @Value("${app.answer.edit.limit-minutes:60}")
    private long answerEditLimitMinutes;

    public AnswerServiceImpl(AnswerRepository answerRepository,
                             ContentRepository contentRepository,
                             UserRepository userRepository,
                             AnswerMapper answerMapper,
                             ServiceHelper serviceHelper,
                             @Lazy IInteractionService interactionService, VoteRepository voteRepository, ReactionRepository reactionRepository) {
        this.answerRepository = answerRepository;
        this.contentRepository = contentRepository;
        this.userRepository = userRepository;
        this.answerMapper = answerMapper;
        this.serviceHelper = serviceHelper;
        this.interactionService = interactionService;
        this.voteRepository = voteRepository;
        this.reactionRepository = reactionRepository;
    }


    @Override
    @Transactional
    public AnswerResponse addAnswer(CreateAnswerRequest request, List<MultipartFile> files) {
        // Note: files parameter is accepted but ignored - answers don't support attachments per UC requirements
        log.info("Adding answer to question ID: {}", request.getQuestionId());
        User author = serviceHelper.getCurrentUser();
        Content question = contentRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + request.getQuestionId()));

        if (question.getContentType() != ContentType.QUESTION) {
            log.error("Cannot add answer to content type: {}", question.getContentType());
            throw new BadRequestException("Cannot add answer to content type: " + question.getContentType());
        }

        Answer answer = answerMapper.createAnswerRequestToAnswer(request);
        answer.setAuthor(author);
        answer.setQuestion(question);

        Answer savedAnswer = answerRepository.save(answer);
        log.info("Answer created with ID: {} for question ID: {} by user: {}", savedAnswer.getId(), question.getId(), author.getUsername());

        question.setAnswerCount(question.getAnswerCount() + 1);
        contentRepository.save(question);

        if (!question.getAuthor().getId().equals(author.getId())) {
            // notificationService.notifyNewAnswer(question.getAuthor(), author, savedAnswer);
        }

        AnswerResponse response = answerMapper.answerToAnswerResponse(savedAnswer);
        setInteractionStatusForCurrentUser(response, author.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnswerResponse> getAnswersForQuestion(UUID questionId, Pageable pageable) {
        if (!contentRepository.existsByIdAndContentType(questionId, ContentType.QUESTION)) {
            throw new ResourceNotFoundException("Question not found with id: " + questionId);
        }

        Page<Answer> answerPage = answerRepository.findByQuestionIdOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(questionId, pageable);
        PageResponse<AnswerResponse> responsePage = answerMapper.answerPageToAnswerPageResponse(answerPage);

        // Lấy trạng thái tương tác cho từng answer trong trang hiện tại
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && responsePage != null && responsePage.getContent() != null) {
            responsePage.getContent().forEach(answerDto -> setInteractionStatusForCurrentUser(answerDto, currentUserId));
        }

        return responsePage;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnswerResponse> getAnswersByAuthor(UUID authorId, Pageable pageable) {
        if (!userRepository.existsById(authorId)) {
            throw new ResourceNotFoundException("Author not found with id: " + authorId);
        }
        Page<Answer> answerPage = answerRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, pageable); // Cần tạo method này trong Repo
        PageResponse<AnswerResponse> responsePage = answerMapper.answerPageToAnswerPageResponse(answerPage);

        // Lấy trạng thái tương tác
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null && responsePage != null && responsePage.getContent() != null) {
            responsePage.getContent().forEach(answerDto -> setInteractionStatusForCurrentUser(answerDto, currentUserId));
        }
        return responsePage;
    }


    @Override
    @Transactional(readOnly = true)
    public AnswerResponse getAnswerById(UUID answerId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));
        AnswerResponse response = answerMapper.answerToAnswerResponse(answer);

        // Lấy trạng thái tương tác
        UUID currentUserId = serviceHelper.getCurrentUserId();
        if (currentUserId != null) {
            setInteractionStatusForCurrentUser(response, currentUserId);
        }
        return response;
    }

    @Override
    @Transactional
    public AnswerResponse updateAnswer(UUID answerId, UpdateAnswerRequest request) {
        User currentUser = serviceHelper.getCurrentUser();
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));

        // Kiểm tra quyền sở hữu
        serviceHelper.ensureCurrentUserIsAuthor(answer.getAuthor().getId(), "update answer");

        // Kiểm tra thời gian sửa (ngắn hơn post/question)
        if (answer.getCreatedAt() != null &&
                LocalDateTime.now().isAfter(answer.getCreatedAt().plusMinutes(answerEditLimitMinutes))) {
            throw new BadRequestException("Edit time limit exceeded (" + answerEditLimitMinutes + " minutes)");
        }

        // Cập nhật body
        answer.setBody(request.getBody());
        // @PreUpdate sẽ tự cập nhật updatedAt

        Answer updatedAnswer = answerRepository.save(answer);

        AnswerResponse response = answerMapper.answerToAnswerResponse(updatedAnswer);
        // Lấy lại trạng thái tương tác
        setInteractionStatusForCurrentUser(response, currentUser.getId());
        return response;
    }

    @Override
    @Transactional
    public void deleteAnswer(UUID answerId) {
        User currentUser = serviceHelper.getCurrentUser();
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));
        Content question = answer.getQuestion(); // Lấy question liên quan

        // Kiểm tra quyền (tác giả hoặc admin/mod)
        if (!answer.getAuthor().getId().equals(currentUser.getId()) /* && !currentUser.isAdminOrModerator() */) {
            throw new UnauthorizedException("User is not authorized to delete this answer");
        }

        // Nếu answer bị xóa là accepted answer -> cập nhật question
        if (answer.getIsAccepted()) {
            question.setAcceptedAnswer(null);
            question.setIsAnswered(false); // Cần kiểm tra lại nếu còn answer khác
            // Có thể cần gọi IQuestionService.unmark... nhưng sẽ gây circular dependency
            // Nên xử lý trực tiếp ở đây
            answer.setIsAccepted(false); // Đảm bảo trạng thái answer cũng được cập nhật trước khi soft delete
        }

        // Giảm answer count trên question
        question.setAnswerCount(Math.max(0, question.getAnswerCount() - 1));
        contentRepository.save(question);

        // Soft delete answer (dùng @SQLDelete)
        answerRepository.delete(answer);

        // TODO: Xử lý xóa mềm các comment, reaction, vote liên quan đến answer này nếu cần
    }

    /**
     * Helper method to set current user's interaction status (vote, reaction) on an AnswerResponse DTO.
     */
    private void setInteractionStatusForCurrentUser(AnswerResponse answerDto, UUID currentUserId) {
        if (currentUserId == null) return;

        Optional<Vote> voteOpt = voteRepository.findByUserIdAndVotableTypeAndVotableId(
                currentUserId, VotableType.ANSWER, answerDto.getId());
        answerDto.setCurrentUserVote(voteOpt.map(Vote::getVoteType).orElse(null));

        Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndReactableTypeAndReactableId(
                currentUserId, ReactableType.ANSWER, answerDto.getId());
        answerDto.setCurrentUserReaction(reactionOpt.map(Reaction::getReactionType).orElse(null));
    }
}
