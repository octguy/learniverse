package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateQuestionRequest;
import org.example.learniversebe.dto.request.UpdateQuestionRequest;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.QuestionResponse;
import org.example.learniversebe.dto.response.QuestionSummaryResponse;
import org.example.learniversebe.service.IQuestionService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/questions")
@Tag(name = "Question & Answer Management", description = "APIs for managing Q&A (UC 3)")
public class QuestionController {

    private final IQuestionService questionService;

    public QuestionController(IQuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a new question", description = "UC 2.2: Creates a new question with attachments. Supports Draft status.")
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @RequestPart("question")
            @Parameter(description = "Question data (JSON)", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
            @Valid CreateQuestionRequest request,

            // 2. File Part
            @RequestPart(value = "files", required = false)
            @Parameter(description = "Attachments (Image/PDF)", content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE))
            List<MultipartFile> files
    ) {
        QuestionResponse response = questionService.createQuestion(request, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Question created successfully", response, null));
    }

    // Add Publish endpoint for Draft Questions
    @PutMapping("/{questionId}/publish")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Publish a draft question", description = "Changes status from DRAFT to PUBLISHED")
    public ResponseEntity<ApiResponse<QuestionResponse>> publishQuestion(@PathVariable UUID questionId) {
        QuestionResponse response = questionService.publishQuestion(questionId);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Question published successfully", response, null));
    }

    @GetMapping
    @Operation(summary = "Get all questions", description = "Retrieves a paginated list of all published questions.")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> getAllQuestions(
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<QuestionSummaryResponse> questionPage = questionService.getAllQuestions(pageable);
        ApiResponse<PageResponse<QuestionSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Questions retrieved successfully", questionPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{questionId}")
    @Operation(summary = "Get a single question by ID", description = "Retrieves detailed information for a single question, including a paginated list of answers.")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(
            @PathVariable UUID questionId,
            @ParameterObject @PageableDefault(size = 5, sort = {"isAccepted", "voteScore"}, direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable answerPageable) {
        QuestionResponse question = questionService.getQuestionById(questionId, answerPageable);
        ApiResponse<QuestionResponse> response = new ApiResponse<>(HttpStatus.OK, "Question retrieved successfully", question, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get a single question by slug", description = "Retrieves a question using its URL-friendly slug, including a paginated list of answers.")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionBySlug(
            @PathVariable String slug,
            @ParameterObject @PageableDefault(size = 5, sort = {"isAccepted", "voteScore"}, direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable answerPageable) {
        QuestionResponse question = questionService.getQuestionBySlug(slug, answerPageable);
        ApiResponse<QuestionResponse> response = new ApiResponse<>(HttpStatus.OK, "Question retrieved successfully", question, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get questions by author", description = "Retrieves a paginated list of questions asked by a specific author.")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> getQuestionsByAuthor(
            @PathVariable UUID authorId,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<QuestionSummaryResponse> questionPage = questionService.getQuestionsByAuthor(authorId, pageable);
        ApiResponse<PageResponse<QuestionSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Questions by author retrieved successfully", questionPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tag/{tagId}")
    @Operation(summary = "Get questions by tag", description = "Retrieves a paginated list of questions associated with a specific tag.")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> getQuestionsByTag(
            @PathVariable UUID tagId,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<QuestionSummaryResponse> questionPage = questionService.getQuestionsByTag(tagId, pageable);
        ApiResponse<PageResponse<QuestionSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Questions by tag retrieved successfully", questionPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user's questions", description = "Retrieves questions of the current user. Supports filtering by status (DRAFT, PUBLISHED, ARCHIVED). Defaults to PUBLISHED.")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> getMyQuestions(
            @RequestParam(required = false) ContentStatus status,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {

        PageResponse<QuestionSummaryResponse> myQuestions = questionService.getMyQuestions(status, pageable);

        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "User questions retrieved successfully", myQuestions, null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search for questions", description = "Performs a full-text search for questions based on a query string.")
    public ResponseEntity<ApiResponse<PageResponse<QuestionSummaryResponse>>> searchQuestions(
            @RequestParam String query,
            @ParameterObject Pageable pageable) {
        PageResponse<QuestionSummaryResponse> questionPage = questionService.searchQuestions(query, pageable);
        ApiResponse<PageResponse<QuestionSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Question search completed", questionPage, null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update an existing question", description = "UC 3.1: Updates a question. Requires user to be the author and within the edit limit.")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request) {
        QuestionResponse updatedQuestion = questionService.updateQuestion(questionId, request);
        ApiResponse<QuestionResponse> response = new ApiResponse<>(HttpStatus.OK, "Question updated successfully", updatedQuestion, null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasRole('USER')") // Hoặc 'hasAnyRole("USER", "MODERATOR", "ADMIN")'
    @Operation(summary = "Delete a question", description = "UC 3.1: Soft-deletes a question. Requires user to be the author or moderator/admin.")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable UUID questionId) {
        questionService.deleteQuestion(questionId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Question deleted successfully", null, null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{questionId}/answers/{answerId}/accept")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Mark an answer as accepted", description = "UC 3.4: Marks an answer as the correct one. Requires user to be the author of the *question*.")
    public ResponseEntity<ApiResponse<Void>> markAnswerAsAccepted(
            @PathVariable UUID questionId,
            @PathVariable UUID answerId) {
        questionService.markAnswerAsAccepted(questionId, answerId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Answer marked as accepted", null, null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{questionId}/answers/{answerId}/accept")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Unmark an accepted answer", description = "UC 3.4: Removes the 'accepted' status from an answer. Requires user to be the author of the *question*.")
    public ResponseEntity<ApiResponse<Void>> unmarkAnswerAsAccepted(
            @PathVariable UUID questionId,
            @PathVariable UUID answerId) {
        questionService.unmarkAnswerAsAccepted(questionId, answerId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Accepted status removed from answer", null, null);
        return ResponseEntity.ok(response);
    }
}
