package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreateTagRequest;
import org.example.learniversebe.dto.request.UpdateTagRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Interface defining business logic operations for Tags.
 */
public interface ITagService {

    /**
     * Creates a new tag. Requires ADMIN or MODERATOR role.
     *
     * @param request DTO containing tag name and description.
     * @return DTO of the newly created tag.
     * @throws org.example.learniversebe.exception.BadRequestException if tag name already exists.
     */
    TagResponse createTag(CreateTagRequest request);

    /**
     * Retrieves all tags (non-paginated).
     * Useful for dropdowns or simple lists.
     *
     * @return A list of all TagResponse DTOs.
     */
    List<TagResponse> getAllTags();

    /**
     * Searches for tags by name (paginated).
     *
     * @param query    The search query string (can be empty to get all).
     * @param pageable Pagination information.
     * @return A PageResponse containing TagResponse DTOs.
     */
    PageResponse<TagResponse> searchTags(String query, Pageable pageable);

    /**
     * Updates an existing tag. Requires ADMIN or MODERATOR role.
     *
     * @param tagId   The UUID of the tag to update.
     * @param request DTO containing updated tag name and/or description.
     * @return DTO of the updated tag.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if tag not found.
     * @throws org.example.learniversebe.exception.BadRequestException if new tag name already exists.
     */
    TagResponse updateTag(UUID tagId, UpdateTagRequest request);

    /**
     * Deletes a tag (soft delete). Requires ADMIN or MODERATOR role.
     *
     * @param tagId The UUID of the tag to delete.
     * @throws org.example.learniversebe.exception.ResourceNotFoundException if tag not found.
     */
    void deleteTag(UUID tagId);
}