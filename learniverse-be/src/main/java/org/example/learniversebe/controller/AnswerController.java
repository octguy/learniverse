package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateAnswerRequest;
import org.example.learniversebe.dto.request.UpdateAnswerRequest;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.AnswerResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.service.IAnswerService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/answers")
@Tag(name = "Question & Answer Management", description = "APIs for managing Q&A (UC 3)")
public class AnswerController {

    private final IAnswerService answerService;

    public AnswerController(IAnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a new answer", description = "UC 3.1: Creates an answer for a question.")
    public ResponseEntity<ApiResponse<AnswerResponse>> createAnswer(
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        AnswerResponse response = answerService.addAnswer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Answer created successfully", response, null));
    }

    @GetMapping("/{answerId}")
    @Operation(summary = "Get a single answer by ID", description = "Retrieves detailed information for a single answer.")
    public ResponseEntity<ApiResponse<AnswerResponse>> getAnswerById(@PathVariable UUID answerId) {
        AnswerResponse answer = answerService.getAnswerById(answerId);
        ApiResponse<AnswerResponse> response = new ApiResponse<>(HttpStatus.OK, "Answer retrieved successfully", answer, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get answers by author", description = "Retrieves a paginated list of answers written by a specific author.")
    public ResponseEntity<ApiResponse<PageResponse<AnswerResponse>>> getAnswersByAuthor(
            @PathVariable UUID authorId,
            @ParameterObject @PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<AnswerResponse> answerPage = answerService.getAnswersByAuthor(authorId, pageable);
        ApiResponse<PageResponse<AnswerResponse>> response = new ApiResponse<>(HttpStatus.OK, "Answers by author retrieved successfully", answerPage, null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{answerId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update an existing answer", description = "UC 3.2: Updates an answer. Requires user to be the author.")
    public ResponseEntity<ApiResponse<AnswerResponse>> updateAnswer(
            @PathVariable UUID answerId,
            @Valid @RequestBody UpdateAnswerRequest request) {
        AnswerResponse updatedAnswer = answerService.updateAnswer(answerId, request);
        ApiResponse<AnswerResponse> response = new ApiResponse<>(HttpStatus.OK, "Answer updated successfully", updatedAnswer, null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{answerId}")
    @PreAuthorize("hasRole('USER')") // Hoặc 'hasAnyRole("USER", "MODERATOR", "ADMIN")'
    @Operation(summary = "Delete an answer", description = "UC 3.2: Soft-deletes an answer. Requires user to be the author or moderator/admin.")
    public ResponseEntity<ApiResponse<Void>> deleteAnswer(@PathVariable UUID answerId) {
        answerService.deleteAnswer(answerId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Answer deleted successfully", null, null);
        return ResponseEntity.ok(response);
    }

    // Lưu ý: getAnswersForQuestion đã được tích hợp vào getQuestionById.
    // Nếu muốn API riêng, bạn có thể thêm endpoint: GET /question/{questionId}
}
