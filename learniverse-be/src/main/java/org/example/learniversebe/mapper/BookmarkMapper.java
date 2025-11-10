package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.BookmarkResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.model.Bookmark;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.enums.ContentType;
import org.mapstruct.AfterMapping;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting Bookmark entities to BookmarkResponse DTOs.
 * Uses ContentMapper to map the associated Content summary.
 */
@Mapper(componentModel = "spring", uses = {ContentMapper.class}) // Thêm ContentMapper vào uses
public interface BookmarkMapper {

    @Mapping(source = "user.id", target = "userId")
    // Tạm thời ignore content summaries, sẽ xử lý trong @AfterMapping
    @Mapping(target = "postSummary", ignore = true)
    @Mapping(target = "questionSummary", ignore = true)
    BookmarkResponse toBookmarkResponse(Bookmark bookmark);

    List<BookmarkResponse> toBookmarkResponseList(List<Bookmark> bookmarks);

    /**
     * Phương thức chạy sau khi mapping cơ bản hoàn tất.
     * Dựa vào contentType của Content để map đúng vào postSummary hoặc questionSummary.
     * @param bookmark Entity nguồn
     * @param response DTO đích (đã được map cơ bản)
     * @param contentMapper Mapper phụ thuộc được inject qua @Context
     */
    @AfterMapping
    default void mapContentSummary(Bookmark bookmark, @MappingTarget BookmarkResponse response, @Context ContentMapper contentMapper) {
        Content content = bookmark.getContent();
        if (content != null) {
            if (content.getContentType() == ContentType.POST) {
                response.setPostSummary(contentMapper.contentToPostSummaryResponse(content));
            } else if (content.getContentType() == ContentType.QUESTION) {
                response.setQuestionSummary(contentMapper.contentToQuestionSummaryResponse(content));
            }
        }
    }

    /**
     * Utility method to convert Page<Bookmark> to PageResponse<BookmarkResponse>.
     * @param page Page<Bookmark> from repository.
     * @return PageResponse<BookmarkResponse>.
     */
    default PageResponse<BookmarkResponse> bookmarkPageToBookmarkPageResponse(Page<Bookmark> page) {
        if (page == null) {
            return null;
        }
        // Cần inject ContentMapper để dùng trong hàm mapContentSummary khi gọi toBookmarkResponse
        // Hoặc đảm bảo context được truyền đúng cách (thường Spring DI sẽ lo việc này)
        List<BookmarkResponse> dtoList = page.getContent().stream()
                .map(this::toBookmarkResponse) // Gọi hàm mapping chính
                .collect(Collectors.toList());
        return PageResponse.fromPage(page, dtoList);
    }
}
