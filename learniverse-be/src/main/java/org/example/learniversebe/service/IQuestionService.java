package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateQuestionRequest;
import org.example.learniversebe.dto.request.UpdateQuestionRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.QuestionResponse;
import org.example.learniversebe.dto.response.QuestionSummaryResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Interface defining business logic operations for Questions (Q&A).
 */
public interface IQuestionService {

    /**
     * Creates a new question based on the provided request data.
     * Requires authenticated user context. Generates slug, associates tags.
     *
     * @param request Data transfer object containing question details (title, body, tags).
     * @param files Attachment
     * @return DTO representing the newly created question.
     * @throws org.example.learniversebe.exception.BadRequestException if tag IDs are invalid.
     */
    QuestionResponse createQuestion(CreateQuestionRequest request, List<MultipartFile> files);

    QuestionResponse publishQuestion(UUID questionId);

    /**
     * Retrieves a paginated list of all published questions.
     * Allows sorting by creation date, vote score, or unanswered status via Pageable's Sort object.
     * Includes user-specific interaction status if possible in summary.
     *
     * @param pageable Pagination and sorting information.
     * @return A PageResponse containing QuestionSummaryResponse DTOs.
     */
    PageResponse<QuestionSummaryResponse> getAllQuestions(Pageable pageable);

    /**
     * Retrieves a paginated list of questions created by a specific author.
     *
     * @param authorId The UUID of the author.
     * @param pageable Pagination information.
     * @return A PageResponse containing QuestionSummaryResponse DTOs.
     * @throws org.example.learniversebe.exception.UserNotFoundException if the author does not exist.
     */
    PageResponse<QuestionSummaryResponse> getQuestionsByAuthor(UUID authorId, Pageable pageable);

    /**
     * Retrieves a paginated list of questions associated with a specific tag (by tag ID).
     *
     * @param tagId    The UUID of the tag.
     * @param pageable Pagination information.
     * @return A PageResponse containing QuestionSummaryResponse DTOs.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the tag does not exist.
     */
    PageResponse<QuestionSummaryResponse> getQuestionsByTag(UUID tagId, Pageable pageable);

    /**
     * Retrieves a single question by its unique ID.
     * Includes detailed information, associated answers (paginated), view count increment,
     * and user-specific interaction status (bookmarked, voted, reacted).
     *
     * @param questionId The UUID of the question to retrieve.
     * @param answerPageable Pagination for the answers associated with this question.
     * @return DTO representing the detailed question, including the requested page of answers and user interaction status.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     */
    QuestionResponse getQuestionById(UUID questionId, Pageable answerPageable);

    /**
     * Retrieves a single question by its unique slug.
     * Includes detailed information, associated answers (paginated), view count increment,
     * and user-specific interaction status.
     *
     * @param slug The unique slug of the question.
     * @param answerPageable Pagination for the answers associated with this question.
     * @return DTO representing the detailed question.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     */
    QuestionResponse getQuestionBySlug(String slug, Pageable answerPageable);

    /**
     * Updates an existing question identified by its ID.
     * Requires authenticated user context, checks ownership and edit time limits.
     * Records the edit history. Updates title, body, tags. Regenerates slug if needed.
     *
     * @param questionId The UUID of the question to update.
     * @param request    Data transfer object containing updated details and edit reason.
     * @return DTO representing the updated question.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user is not the author or edit time limit exceeded.
     * @throws org.example.learniversebe.exception.BadRequestException if tag IDs are invalid.
     */
    QuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest request);

    /**
     * Deletes a question identified by its ID (soft delete).
     * Requires authenticated user context, checks ownership or moderator/admin privileges.
     *
     * @param questionId The UUID of the question to delete.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user does not have permission.
     */
    void deleteQuestion(UUID questionId);

    /**
     * Marks an answer as the accepted answer for a specific question.
     * Only the author of the question can perform this action.
     * Updates the `isAnswered` status of the question and the `isAccepted` status of the answer.
     * Can only accept one answer per question; previous accepted answer (if any) is unaccepted.
     *
     * @param questionId The UUID of the question.
     * @param answerId   The UUID of the answer to accept.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question or answer is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the current user is not the author of the question.
     * @throws org.example.learniversebe.exception.BadRequestException if the answer does not belong to the specified question.
     */
    void markAnswerAsAccepted(UUID questionId, UUID answerId);

    /**
     * Removes the accepted status from an answer for a specific question.
     * Only the author of the question can perform this action.
     * Updates the `isAnswered` status of the question if this was the only accepted answer.
     * Updates the `isAccepted` status of the answer.
     *
     * @param questionId The UUID of the question.
     * @param answerId   The UUID of the answer to unaccept.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question or answer is not found, or if the specified answer wasn't the accepted one.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the current user is not the author of the question.
     */
    void unmarkAnswerAsAccepted(UUID questionId, UUID answerId);

    /**
     * Performs a search for questions based on a query string using full-text search.
     * Returns a paginated list of summaries.
     *
     * @param query    The search query string.
     * @param pageable Pagination information.
     * @return A PageResponse containing QuestionSummaryResponse DTOs matching the search query.
     */
    PageResponse<QuestionSummaryResponse> searchQuestions(String query, Pageable pageable);
}