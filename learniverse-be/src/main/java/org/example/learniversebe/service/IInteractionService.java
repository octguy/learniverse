package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.BookmarkRequest;
import org.example.learniversebe.dto.request.ReactionRequest;
import org.example.learniversebe.dto.request.VoteRequest;
import org.example.learniversebe.dto.response.BookmarkResponse; // Assuming you create this DTO
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ReactableType; // Ensure correct import
import org.example.learniversebe.enums.VotableType;   // Ensure correct import
import org.example.learniversebe.enums.ReactionType; // Ensure correct import

import org.springframework.data.domain.Pageable;


import java.util.UUID;

/**
 * Interface defining business logic operations for user interactions
 * like Voting, Reacting, and Bookmarking.
 */
public interface IInteractionService {

    // --- Vote ---

    /**
     * Casts, changes, or removes a vote (UPVOTE/DOWNVOTE) on a votable entity (Question/Answer).
     * Implements toggle logic: voting again with the same type removes the vote.
     * Updates the vote score and potentially upvote/downvote counts on the target entity.
     * Requires authenticated user context. User cannot vote on their own content/answer.
     *
     * @param request DTO containing the type/ID of the entity and the vote type.
     * @return The updated vote score of the entity after the operation.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the entity is not found.
     * @throws org.example.learniversebe.exception.BadRequestException if the entity type is not votable, user tries to vote own content, or other validation fails.
     */
    int vote(VoteRequest request);

    // --- Reaction ---

    /**
     * Adds, changes, or removes a reaction on a reactable entity (Content/Answer/Comment).
     * Implements toggle logic: reacting again with the same type removes the reaction.
     * Updates the reaction count on the target entity.
     * Requires authenticated user context.
     *
     * @param request DTO containing the type/ID of the entity and the reaction type.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the entity is not found.
     * @throws org.example.learniversebe.exception.BadRequestException if the entity type is not reactable or other validation fails.
     */
    void react(ReactionRequest request);


    // --- Bookmark ---

    /**
     * Adds a bookmark for a specific content (Post/Question) for the current user.
     * Updates the bookmark count on the content.
     * Requires authenticated user context.
     *
     * @param request DTO containing the content ID and optional collection/notes.
     * @return DTO representing the created bookmark. // Changed void to return DTO
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the content is not found.
     * @throws org.example.learniversebe.exception.BadRequestException if the content is already bookmarked by the user.
     */
    BookmarkResponse addBookmark(BookmarkRequest request); // Changed return type

    /**
     * Removes a bookmark for a specific content for the current user.
     * Updates the bookmark count on the content.
     * Requires authenticated user context.
     *
     * @param contentId The UUID of the content to unbookmark.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the bookmark is not found for the user/content.
     */
    void removeBookmark(UUID contentId);

    /**
     * Retrieves a paginated list of bookmarks for the currently authenticated user.
     * Allows optional filtering by collection name. Includes summary of bookmarked content.
     *
     * @param collectionName Optional filter for bookmark collection name (case-insensitive search perhaps).
     * @param pageable       Pagination information.
     * @return A PageResponse containing BookmarkResponse DTOs.
     */
    PageResponse<BookmarkResponse> getUserBookmarks(String collectionName, Pageable pageable);

    /**
     * Checks if the current authenticated user has bookmarked a specific content item.
     *
     * @param contentId The UUID of the content item.
     * @return true if the user has bookmarked the content, false otherwise.
     */
    boolean isContentBookmarkedByUser(UUID contentId);

    // Note: Getting user's current vote/reaction for a specific item is typically handled
    // within the getPostById, getQuestionById, getAnswerById, getCommentById methods
    // by performing an additional check based on the current user's ID.
}