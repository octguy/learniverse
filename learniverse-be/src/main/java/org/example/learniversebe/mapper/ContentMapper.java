package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.CreateQuestionRequest;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.model.ContentTag;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Mapper interface for converting between Content entity and various Content DTOs (Post/Question).
 * Uses other mappers (UserMapper, TagMapper, AttachmentMapper, AnswerMapper) for nested objects.
 */
@Mapper(componentModel = "spring", uses = {UserMapper.class, TagMapper.class, AttachmentMapper.class, AnswerMapper.class})
public interface ContentMapper {
    /**
     * Maps CreatePostRequest DTO to Content entity. Sets contentType to POST.
     * Ignores fields that are auto-generated, managed by lifecycle callbacks,
     * set in the service layer, or handled separately (like tags, attachments).
     */
    @Mapping(target = "contentType", constant = "POST")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "commentCount", ignore = true)
    @Mapping(target = "reactionCount", ignore = true)
    @Mapping(target = "bookmarkCount", ignore = true)
    @Mapping(target = "shareCount", ignore = true)
    @Mapping(target = "voteScore", ignore = true)
    @Mapping(target = "acceptedAnswer", ignore = true)
    @Mapping(target = "answerCount", ignore = true)
    @Mapping(target = "isAnswered", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "lastEditedAt", ignore = true)
    @Mapping(target = "searchVector", ignore = true)
    @Mapping(target = "contentTags", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "group", ignore = true)
    @Mapping(target = "isPinned", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "originalContent", ignore = true)
    Content createPostRequestToContent(CreatePostRequest request);

    /**
     * Maps CreateQuestionRequest DTO to Content entity. Sets contentType to QUESTION.
     * Ignores fields similarly to the createPostRequestToContent mapping.
     */
    @Mapping(target = "contentType", constant = "QUESTION")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "commentCount", ignore = true)
    @Mapping(target = "reactionCount", ignore = true)
    @Mapping(target = "bookmarkCount", ignore = true)
    @Mapping(target = "shareCount", ignore = true)
    @Mapping(target = "voteScore", ignore = true)
    @Mapping(target = "acceptedAnswer", ignore = true)
    @Mapping(target = "answerCount", ignore = true)
    @Mapping(target = "isAnswered", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    @Mapping(target = "lastEditedAt", ignore = true)
    @Mapping(target = "searchVector", ignore = true)
    @Mapping(target = "contentTags", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "group", ignore = true)
    @Mapping(target = "isPinned", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "originalContent", ignore = true)
    Content createQuestionRequestToContent(CreateQuestionRequest request);

    /**
     * Maps a Content entity to a detailed PostResponse DTO.
     * Uses the custom mapping method for tags.
     * Ignores user-specific fields which need logic in the Service.
     */
    @Mapping(source = "contentTags", target = "tags", qualifiedByName = "contentTagsToTagResponses")
    @Mapping(target = "bookmarkedByCurrentUser", ignore = true)
    @Mapping(target = "currentUserReaction", ignore = true)
    @Mapping(source = "originalContent", target = "originalPost", qualifiedByName = "mapOriginalPost")
    @Mapping(source = "group.id", target = "groupId")
    @Mapping(source = "group.name", target = "groupName")
    @Mapping(source = "group.slug", target = "groupSlug")
    @Mapping(source = "group.avatarUrl", target = "groupAvatarUrl")
    PostResponse contentToPostResponse(Content content);

    /**
     * Maps a Content entity to a summary PostSummaryResponse DTO.
     * Uses the custom mapping method for tags.
     */
    @Mapping(source = "contentTags", target = "tags", qualifiedByName = "contentTagsToTagResponses")
    @Mapping(source = "body", target = "bodyExcerpt", qualifiedByName = "generateExcerpt")
    @Mapping(source = "body", target = "body")
    @Mapping(target = "bookmarkedByCurrentUser", ignore = true)
    @Mapping(target = "currentUserReaction", ignore = true)
    @Mapping(source = "originalContent", target = "originalPost", qualifiedByName = "mapOriginalPost")
    @Mapping(source = "group.id", target = "groupId")
    @Mapping(source = "group.name", target = "groupName")
    @Mapping(source = "group.slug", target = "groupSlug")
    @Mapping(source = "group.avatarUrl", target = "groupAvatarUrl")
    PostSummaryResponse contentToPostSummaryResponse(Content content);

    /**
     * Maps a Content entity to a detailed QuestionResponse DTO.
     * Maps acceptedAnswer ID.
     * Ignores the list of answers (should be fetched separately).
     * Ignores user-specific fields.
     */
    @Mapping(source = "contentTags", target = "tags", qualifiedByName = "contentTagsToTagResponses")
    @Mapping(source = "acceptedAnswer.id", target = "acceptedAnswerId")
    @Mapping(target = "answers", ignore = true)
    @Mapping(target = "bookmarkedByCurrentUser", ignore = true)
    @Mapping(target = "currentUserReaction", ignore = true)
    @Mapping(target = "currentUserVote", ignore = true)
    QuestionResponse contentToQuestionResponse(Content content);

    /**
     * Maps a Content entity to a summary QuestionSummaryResponse DTO.
     * Maps acceptedAnswer ID.
     */
    @Mapping(source = "contentTags", target = "tags", qualifiedByName = "contentTagsToTagResponses")
    @Mapping(source = "acceptedAnswer.id", target = "acceptedAnswerId")
    @Mapping(source = "body", target = "bodyExcerpt", qualifiedByName = "generateExcerpt") // Dùng qualifiedByName
    @Mapping(target = "bookmarkedByCurrentUser", ignore = true)
    @Mapping(target = "currentUserReaction", ignore = true)
    @Mapping(target = "currentUserVote", ignore = true)
    QuestionSummaryResponse contentToQuestionSummaryResponse(Content content);

    /**
     * Helper method used by MapStruct (@Named) to map a Set of join entities (ContentTag)
     * to a Set of target DTOs (TagResponse). It extracts the Tag from the join entity
     * and uses the TagMapper (injected via @Context) to perform the final conversion.
     *
     * @param contentTags The set of ContentTag join entities.
     * @return A set of TagResponse DTOs, or an empty set if input is null/empty.
     */
    @Named("contentTagsToTagResponses")
    default Set<TagResponse> mapContentTagsToTagResponses(Set<ContentTag> contentTags) {
        if (contentTags == null || contentTags.isEmpty()) {
            return Collections.emptySet();
        }
        // Use the injected TagMapper instance provided by @Context
        TagMapper tagMapper = Mappers.getMapper(TagMapper.class);
        return contentTags.stream()
                .map(ContentTag::getTag) // Get the Tag entity from ContentTag
                .map(tagMapper::toTagResponse) // Use TagMapper to convert Tag -> TagResponse
                .collect(Collectors.toSet());
    }

    // --- Utility Methods for Pagination ---

    /**
     * Converts a Page<Content> (from repository) to PageResponse<PostSummaryResponse>.
     * Uses the mapping methods defined above.
     * 'this' refers to the instance of ContentMapper being used.
     */
    default PageResponse<PostSummaryResponse> contentPageToPostSummaryPage(Page<Content> page) {
        if (page == null) return null;
        List<PostSummaryResponse> dtoList = page.getContent().stream()
                .map(this::contentToPostSummaryResponse) // 'this' refers to the mapper instance
                .collect(Collectors.toList());
        return PageResponse.fromPage(page, dtoList);
    }

    /**
     * Converts a Page<Content> (from repository) to PageResponse<QuestionSummaryResponse>.
     * Uses the mapping methods defined above.
     */
    default PageResponse<QuestionSummaryResponse> contentPageToQuestionSummaryPage(Page<Content> page) {
        if (page == null) return null;
        List<QuestionSummaryResponse> dtoList = page.getContent().stream()
                .map(this::contentToQuestionSummaryResponse) // 'this' refers to the mapper instance
                .collect(Collectors.toList());
        return PageResponse.fromPage(page, dtoList);
    }

    @Named("generateExcerpt")
    default String generateExcerpt(String body) {
        if (body == null || body.isEmpty()) {
            return null;
        }
        int limit = 150;
        return body.length() > limit ? body.substring(0, limit) + "..." : body;
    }

    @Named("mapOriginalPost")
    default PostSummaryResponse mapOriginalPost(Content originalContent) {
        // Case 1: originalContent là NULL.
        // Có 2 lý do:
        // a. Bài viết này không phải là bài Share (cột original_id null).
        // b. Bài viết gốc ĐÃ BỊ XÓA (Soft delete), và nhờ @NotFound(IGNORE), Hibernate trả về null thay vì ném Exception.
        if (originalContent == null) {
            return null;
        }

        // Case 2: Phòng hờ trường hợp filter không hoạt động (dữ liệu rác vẫn load lên được)
        if (originalContent.getDeletedAt() != null) {
            return null;
        }

        // Case 3: Bài gốc còn tồn tại -> Map bình thường
        // Cần gọi lại mapper để convert Entity -> DTO
        PostSummaryResponse response = contentToPostSummaryResponse(originalContent);

        // Đặt originalPost của bài con bằng null để tránh lặp vô tận hoặc dữ liệu quá sâu
        response.setOriginalPost(null);

        return response;
    }
}