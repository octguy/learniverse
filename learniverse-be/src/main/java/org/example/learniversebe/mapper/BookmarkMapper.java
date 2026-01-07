package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.BookmarkResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.example.learniversebe.dto.response.QuestionSummaryResponse;
import org.example.learniversebe.model.Bookmark;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.enums.ContentType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

import java.util.List;

@Mapper(componentModel = "spring", uses = {ContentMapper.class})
public interface BookmarkMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "collectionName", expression = "java(bookmark.getCollectionName() == null ? \"General\" : bookmark.getCollectionName())")
    @Mapping(target = "postSummary", expression = "java(mapPostSummary(bookmark, contentMapper))")
    @Mapping(target = "questionSummary", expression = "java(mapQuestionSummary(bookmark, contentMapper))")
    BookmarkResponse toBookmarkResponse(Bookmark bookmark, @org.mapstruct.Context ContentMapper contentMapper);

//    List<BookmarkResponse> toBookmarkResponseList(List<Bookmark> bookmarks);

    /**
     * Map sang PostSummary nếu là POST
     */
    default PostSummaryResponse mapPostSummary(Bookmark bookmark, ContentMapper contentMapper) {
        Content content = bookmark.getContent();
        if (content != null && content.getContentType() == ContentType.POST) {
            return contentMapper.contentToPostSummaryResponse(content);
        }
        return null;
    }

    /**
     * Map sang QuestionSummary nếu là QUESTION
     */
    default QuestionSummaryResponse mapQuestionSummary(Bookmark bookmark, ContentMapper contentMapper) {
        Content content = bookmark.getContent();
        if (content != null && content.getContentType() == ContentType.QUESTION) {
            return contentMapper.contentToQuestionSummaryResponse(content);
        }
        return null;
    }

    /**
     * Convert Page<Bookmark> to PageResponse<BookmarkResponse>
     */
    default PageResponse<BookmarkResponse> bookmarkPageToBookmarkPageResponse(Page<Bookmark> page, ContentMapper contentMapper) {
        if (page == null) {
            return null;
        }
        List<BookmarkResponse> dtoList = page.getContent().stream()
                .map(b -> toBookmarkResponse(b, contentMapper))
                .toList();
        return PageResponse.fromPage(page, dtoList);
    }
}