package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.UpdatePostRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Interface defining business logic operations for Posts.
 */
public interface IPostService {

    /**
     * Creates a new post based on the provided request data.
     * Requires authenticated user context. Generates slug, sets initial status,
     * associates tags, handles attachments (if any), and saves the post.
     *
     * @param request Data transfer object containing post details (title, body, tags).
     * @return DTO representing the newly created post, including generated ID and slug.
     * @throws org.example.learniversebe.exception.BadRequestException if tag IDs are invalid.
     */
    PostResponse createPost(CreatePostRequest request);

    /**
     * Retrieves a paginated list of all published posts suitable for the general newsfeed.
     * Posts are typically sorted by publication date descending.
     * User-specific interaction status (bookmarked, reacted) might be included.
     *
     * @param pageable Pagination information (page number, size, sort).
     * @return A PageResponse containing PostSummaryResponse DTOs.
     */
    PageResponse<PostSummaryResponse> getNewsfeedPosts(Pageable pageable);

    /**
     * Retrieves a paginated list of posts created by a specific author.
     *
     * @param authorId The UUID of the author.
     * @param pageable Pagination information.
     * @return A PageResponse containing PostSummaryResponse DTOs.
     * @throws org.example.learniversebe.exception.UserNotFoundException if the author does not exist.
     */
    PageResponse<PostSummaryResponse> getPostsByAuthor(UUID authorId, Pageable pageable);

    /**
     * Retrieves a paginated list of posts associated with a specific tag (by tag ID).
     *
     * @param tagId    The UUID of the tag.
     * @param pageable Pagination information.
     * @return A PageResponse containing PostSummaryResponse DTOs.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the tag does not exist.
     */
    PageResponse<PostSummaryResponse> getPostsByTag(UUID tagId, Pageable pageable);

    /**
     * Retrieves a single post by its unique ID. Includes detailed information.
     * Increments the view count (implementing throttling logic recommended).
     * Fetches user-specific interaction status (bookmarked, reacted) for the current user.
     *
     * @param postId The UUID of the post to retrieve.
     * @return DTO representing the detailed post including user interaction status.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the post is not found or not published (depending on access rules).
     */
    PostResponse getPostById(UUID postId);

    /**
     * Retrieves a single post by its unique slug. Includes detailed information.
     * Increments the view count (implementing throttling logic recommended).
     * Fetches user-specific interaction status (bookmarked, reacted) for the current user.
     *
     * @param slug The unique slug of the post.
     * @return DTO representing the detailed post including user interaction status.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the post is not found or not published.
     */
    PostResponse getPostBySlug(String slug);


    /**
     * Updates an existing post identified by its ID.
     * Requires authenticated user context.
     * Checks if the user is the author and if the edit is within the allowed time limit (e.g., 24 hours).
     * Updates title, body, and tags. Records the edit reason in history.
     * Regenerates slug if title changes significantly (optional).
     *
     * @param postId  The UUID of the post to update.
     * @param request Data transfer object containing updated details and edit reason.
     * @return DTO representing the updated post.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the post is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user is not the author or the edit window has passed.
     * @throws org.example.learniversebe.exception.BadRequestException if tag IDs are invalid.
     */
    PostResponse updatePost(UUID postId, UpdatePostRequest request);

    /**
     * Deletes a post identified by its ID (performs a soft delete).
     * Requires authenticated user context. Checks if the user is the author or has moderator/admin privileges.
     * Sets the `deletedAt` timestamp on the content entity.
     *
     * @param postId The UUID of the post to delete.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if the post is not found.
     * @throws org.example.learniversebe.exception.UnauthorizedException if the user does not have permission to delete the post.
     */
    void deletePost(UUID postId);

    /**
     * Performs a search for posts based on a query string using full-text search.
     * Returns a paginated list of summaries.
     *
     * @param query    The search query string.
     * @param pageable Pagination information.
     * @return A PageResponse containing PostSummaryResponse DTOs matching the search query.
     */
    PageResponse<PostSummaryResponse> searchPosts(String query, Pageable pageable);
}