package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.model.Tag;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.Set;

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
}