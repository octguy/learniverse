package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateAnswerRequest;
import org.example.learniversebe.dto.request.UpdateAnswerRequest;
import org.example.learniversebe.dto.response.AnswerResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Interface defining business logic operations for Answers.
 */
public interface IAnswerService {

    /**
     * Adds a new answer to a specific question.
     * Requires authenticated user context.
     * Increments the answer count on the question.
     * Sends notification to the question author (if different from answer author).
     *
     * @param request Data transfer object containing answer details (body) and question ID.
     * @param files   Optional list of attachment files.
     * @return DTO representing the newly created answer.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     * @throws org.example.learniversebe.exception.BadRequestException if the target content is not a QUESTION or other validation fails.
     */
    AnswerResponse addAnswer(CreateAnswerRequest request, List<MultipartFile> files);

    /**
     * Retrieves a paginated list of answers for a specific question.
     * Sorted by acceptance status first, then by vote score descending, then by creation date ascending.
     * Includes user-specific vote/reaction status for each answer fetched.
     *
     * @param questionId The UUID of the question.
     * @param pageable   Pagination information (includes sorting preferences).
     * @return A PageResponse containing AnswerResponse DTOs.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the question is not found.
     */
    PageResponse<AnswerResponse> getAnswersForQuestion(UUID questionId, Pageable pageable);

    /**
     * Retrieves a paginated list of answers created by a specific author.
     *
     * @param authorId The UUID of the author.
     * @param pageable Pagination information.
     * @return A PageResponse containing AnswerResponse DTOs.
     * @throws org.example.learniversebe.exception.UserNotFoundException if the author does not exist.
     */
    PageResponse<AnswerResponse> getAnswersByAuthor(UUID authorId, Pageable pageable);

    /**
     * Retrieves a single answer by its ID.
     * Includes user-specific vote/reaction status.
     *
     * @param answerId The UUID of the answer.
     * @return DTO representing the answer.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the answer is not found.
     */
    AnswerResponse getAnswerById(UUID answerId);

    /**
     * Updates an existing answer.
     * Requires authenticated user context, checks ownership and potential edit limits (e.g., shorter window than posts/questions).
     *
     * @param answerId The UUID of the answer to update.
     * @param request  Data transfer object containing the updated body.
     * @return DTO representing the updated answer.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the answer is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user is not the author or edit limit exceeded.
     */
    AnswerResponse updateAnswer(UUID answerId, UpdateAnswerRequest request);

    /**
     * Deletes an answer (soft delete).
     * Requires authenticated user context, checks ownership or moderator/admin privileges.
     * Decrements the answer count on the associated question.
     * If the deleted answer was the accepted one, updates the question's `isAnswered` status and potentially unmarks the answer.
     *
     * @param answerId The UUID of the answer to delete.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the answer is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user does not have permission.
     */
    void deleteAnswer(UUID answerId);
}