package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.request.CreateCommentRequest;
import org.example.learniversebe.dto.response.CommentResponse;
import org.example.learniversebe.dto.response.PageResponse; // Import PageResponse
import org.example.learniversebe.model.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper interface for converting between Comment entity and Comment DTOs.
 * Uses UserMapper for mapping the author information.
 */
@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface CommentMapper {

    /**
     * Maps a CreateCommentRequest DTO to a Comment entity.
     * Ignores fields set by the service or database (ID, author, parent, timestamps, etc.).
     * Note: commentableType and commentableId are mapped automatically by name if DTO field matches.
     * @param request The CreateCommentRequest DTO.
     * @return The mapped Comment entity.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "author", ignore = true) // Will be set in the Service layer
    @Mapping(target = "parent", ignore = true) // Will be set in the Service layer if it's a reply
    @Mapping(target = "replies", ignore = true) // Replies are managed separately
    @Mapping(target = "bodyHtml", ignore = true) // HTML rendering is separate
    @Mapping(target = "replyCount", ignore = true)
    @Mapping(target = "reactionCount", ignore = true)
    @Mapping(target = "isEdited", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Comment createCommentRequestToComment(CreateCommentRequest request);

    /**
     * Maps a Comment entity to a CommentResponse DTO.
     * Maps the parent comment's ID.
     * Ignores replies and mentionedUsers which should be fetched separately if needed.
     * @param comment The Comment entity.
     * @return The mapped CommentResponse DTO.
     */
    @Mapping(source = "parent.id", target = "parentId") // Map ID from parent comment object
    // Avoid mapping replies here to prevent N+1 issues; provide a separate endpoint/logic for replies
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "mentionedUsers", ignore = true) // Needs specific logic in Service to fetch mentions
    CommentResponse commentToCommentResponse(Comment comment);

    /**
     * Maps a List of Comment entities to a List of CommentResponse DTOs.
     * @param comments The list of Comment entities.
     * @return The list of CommentResponse DTOs.
     */
    List<CommentResponse> commentsToCommentResponses(List<Comment> comments);

    /**
     * Utility method to convert a Page<Comment> (from repository) to PageResponse<CommentResponse>.
     * @param page The Page<Comment> object from the repository.
     * @return A PageResponse containing CommentResponse DTOs and pagination info.
     */
    default PageResponse<CommentResponse> commentPageToCommentPageResponse(Page<Comment> page) {
        if (page == null) return null;
        List<CommentResponse> dtoList = page.getContent().stream()
                .map(this::commentToCommentResponse) // 'this' refers to the injected mapper instance
                .collect(Collectors.toList());
        return PageResponse.fromPage(page, dtoList);
    }
}