package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateCommentRequest;
import org.example.learniversebe.dto.request.UpdateCommentRequest;
import org.example.learniversebe.dto.response.CommentResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ReactableType;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Interface defining business logic operations for Comments (polymorphic, applying to Content and Answer).
 */
public interface ICommentService {

    /**
     * Adds a new comment to a specified commentable entity (Content or Answer).
     * Can create a top-level comment or a reply to an existing comment (parentId).
     * Requires authenticated user context.
     * Increments the comment count on the target entity (Content/Answer).
     * If parentId is provided, increments reply count on the parent comment.
     * Processes mentions (@username) and creates Mention entities/notifications.
     * Sends notification to the author of the entity being commented on (or parent comment author).
     *
     * @param request DTO containing comment body, commentable type/ID, optional parent ID, and mentioned user IDs.
     * @return DTO representing the newly created comment.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the commentable entity or parent comment is not found.
     * @throws org.example.learniversebe.exception.BadRequestException if input is invalid (e.g., nesting too deep, invalid type).
     */
    CommentResponse addComment(CreateCommentRequest request);

    /**
     * Retrieves a paginated list of top-level (root) comments for a specific commentable entity.
     * Sorted typically by creation date ascending.
     * Includes user-specific reaction status for each comment.
     *
     * @param commentableType The type of the entity being commented on (CONTENT, ANSWER).
     * @param commentableId   The UUID of the entity.
     * @param pageable        Pagination information.
     * @return A PageResponse containing CommentResponse DTOs for root comments.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the commentable entity is not found.
     */
    PageResponse<CommentResponse> getCommentsFor(ReactableType commentableType, UUID commentableId, Pageable pageable);

    /**
     * Retrieves a paginated list of replies for a specific parent comment.
     * Sorted typically by creation date ascending.
     * Includes user-specific reaction status for each reply.
     *
     * @param parentId The UUID of the parent comment whose replies are to be fetched.
     * @param pageable Pagination information.
     * @return A PageResponse containing CommentResponse DTOs representing replies.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the parent comment is not found.
     */
    PageResponse<CommentResponse> getRepliesForComment(UUID parentId, Pageable pageable);

    /**
     * Retrieves a single comment by its ID.
     * Includes user-specific reaction status.
     *
     * @param commentId The UUID of the comment.
     * @return DTO representing the comment.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the comment is not found.
     */
    CommentResponse getCommentById(UUID commentId);

    /**
     * Updates an existing comment.
     * Requires authenticated user context, checks ownership and potential edit limits.
     * Updates mention list based on the new request.
     * Marks the comment as edited.
     *
     * @param commentId The UUID of the comment to update.
     * @param request   Data transfer object containing the updated body and optional new mentions.
     * @return DTO representing the updated comment.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the comment is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user is not the author or edit limit exceeded.
     */
    CommentResponse updateComment(UUID commentId, UpdateCommentRequest request);

    /**
     * Deletes a comment (soft delete).
     * Requires authenticated user context, checks ownership or moderator privileges.
     * Decrements comment count on the parent entity (Content/Answer).
     * If it's a reply, decrements reply count on the parent comment.
     * Handles deletion/orphaning of nested replies based on defined strategy.
     *
     * @param commentId The UUID of the comment to delete.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the comment is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user does not have permission.
     */
    void deleteComment(UUID commentId);
}