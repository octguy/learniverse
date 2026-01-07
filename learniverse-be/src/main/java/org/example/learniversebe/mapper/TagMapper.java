package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.request.CreateTagRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.model.Tag;
import org.example.learniversebe.model.GroupTag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Mapper interface for converting between Tag entity and Tag DTOs.
 */
@Mapper(componentModel = "spring")
public interface TagMapper {

    /**
     * Maps a Tag entity to a TagResponse DTO.
     * @param tag The Tag entity.
     * @return The TagResponse DTO.
     */
    TagResponse toTagResponse(Tag tag);

    /**
     * Maps a List of Tag entities to a List of TagResponse DTOs.
     * @param tags The list of Tag entities.
     * @return The list of TagResponse DTOs.
     */
    List<TagResponse> toTagResponseList(List<Tag> tags);

    /**
     * Maps a Set of Tag entities to a Set of TagResponse DTOs.
     * @param tags The set of Tag entities.
     * @return The set of TagResponse DTOs.
     */
    Set<TagResponse> toTagResponseSet(Set<Tag> tags);

    /**
     * Maps a CreateTagRequest DTO to a Tag entity.
     * Ignores fields that are auto-generated or set by lifecycle callbacks.
     * @param request The CreateTagRequest DTO.
     * @return The mapped Tag entity.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true) // Sẽ được set bởi @PrePersist trong Entity
    @Mapping(target = "contentTags", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Tag createTagRequestToTag(CreateTagRequest request);

    /**
     * Utility method to convert a Page<Tag> (from repository) to PageResponse<TagResponse>.
     * @param page The Page<Tag> object from the repository.
     * @return A PageResponse containing TagResponse DTOs and pagination info.
     */
    default PageResponse<TagResponse> tagPageToTagPageResponse(Page<Tag> page) {
        if (page == null) {
            return null;
        }
        List<TagResponse> dtoList = page.getContent().stream()
                .map(this::toTagResponse) // 'this' refers to the injected mapper instance
                .collect(Collectors.toList());
        return PageResponse.fromPage(page, dtoList);
    }

    /**
     * Maps a GroupTag to TagResponse by extracting the Tag.
     */
    default TagResponse groupTagToTagResponse(GroupTag groupTag) {
        if (groupTag == null || groupTag.getTag() == null) {
            return null;
        }
        return toTagResponse(groupTag.getTag());
    }

    /**
     * Maps a Set of GroupTag to List of TagResponse.
     */
    default List<TagResponse> groupTagsToTagResponses(Set<GroupTag> groupTags) {
        if (groupTags == null) {
            return null;
        }
        return groupTags.stream()
                .map(this::groupTagToTagResponse)
                .collect(Collectors.toList());
    }
}