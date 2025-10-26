package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.AttachmentResponse;
import org.example.learniversebe.model.Attachment;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import java.util.List;
import java.util.Set;

/**
 * Mapper interface for converting between Attachment entity and Attachment DTOs.
 */
@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    /**
     * Maps an Attachment entity to an AttachmentResponse DTO.
     * @param attachment The Attachment entity.
     * @return The AttachmentResponse DTO.
     */
    AttachmentResponse toAttachmentResponse(Attachment attachment);

    /**
     * Maps a List of Attachment entities to a List of AttachmentResponse DTOs.
     * @param attachments The list of Attachment entities.
     * @return The list of AttachmentResponse DTOs.
     */
    List<AttachmentResponse> toAttachmentResponseList(List<Attachment> attachments);

    /**
     * Maps a Set of Attachment entities to a Set of AttachmentResponse DTOs.
     * @param attachments The set of Attachment entities.
     * @return The set of AttachmentResponse DTOs.
     */
    Set<AttachmentResponse> toAttachmentResponseSet(Set<Attachment> attachments);
}