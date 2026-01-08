package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.request.CreateAnswerRequest;
import org.example.learniversebe.dto.response.AnswerResponse;
import org.example.learniversebe.dto.response.PageResponse; // Import PageResponse
import org.example.learniversebe.model.Answer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;


/**
 * Mapper interface for converting between Answer entity and Answer DTOs.
 * Uses UserMapper for mapping the author information.
 */
@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface AnswerMapper {

    /**
     * Maps a CreateAnswerRequest DTO to an Answer entity.
     * Ignores fields that should be set by the service layer (ID, question, author, timestamps, etc.).
     * @param request The CreateAnswerRequest DTO.
     * @return The mapped Answer entity.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "question", ignore = true) // Will be set in the Service layer
    @Mapping(target = "author", ignore = true)   // Will be set in the Service layer
    @Mapping(target = "bodyHtml", ignore = true) // Handle rendering separately if needed
    @Mapping(target = "voteScore", ignore = true)
    @Mapping(target = "upvoteCount", ignore = true)
    @Mapping(target = "downvoteCount", ignore = true)
    @Mapping(target = "isAccepted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "acceptedInQuestion", ignore = true)
    Answer createAnswerRequestToAnswer(CreateAnswerRequest request);

    /**
     * Maps an Answer entity to an AnswerResponse DTO.
     * Maps the question ID from the nested question object.
     * Ignores fields that require additional logic or queries (counts, user-specific states).
     * @param answer The Answer entity.
     * @return The mapped AnswerResponse DTO.
     */
    @Mapping(source = "question.id", target = "questionId") // Map ID from nested question object
    @Mapping(target = "commentCount", ignore = true) // Needs separate query/logic if needed in response
    @Mapping(target = "reactionCount", ignore = true)// Needs separate query/logic
    @Mapping(target = "currentUserVote", ignore = true) // Needs specific logic in Service
    @Mapping(target = "currentUserReaction", ignore = true) // Needs specific logic in Service
    @Mapping(target = "acceptedInQuestion", ignore = true)
    AnswerResponse answerToAnswerResponse(Answer answer);

    /**
     * Maps a List of Answer entities to a List of AnswerResponse DTOs.
     * @param answers The list of Answer entities.
     * @return The list of AnswerResponse DTOs.
     */
    List<AnswerResponse> answersToAnswerResponses(List<Answer> answers);

    /**
     * Utility method to convert a Page<Answer> (from repository) to PageResponse<AnswerResponse>.
     * Uses the individual mapping method answerToAnswerResponse.
     * @param page The Page<Answer> object from the repository.
     * @return A PageResponse containing AnswerResponse DTOs and pagination info.
     */
    default PageResponse<AnswerResponse> answerPageToAnswerPageResponse(Page<Answer> page) {
        if (page == null) return null;
        List<AnswerResponse> dtoList = page.getContent().stream()
                .map(this::answerToAnswerResponse) // 'this' refers to the injected mapper instance
                .collect(Collectors.toList());
        // Uses the static helper method from PageResponse DTO
        return PageResponse.fromPage(page, dtoList);
    }
}