package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateCommentRequest;
import org.example.learniversebe.dto.request.UpdateCommentRequest;
import org.example.learniversebe.enums.CommentableType;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.CommentResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.service.ICommentService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/comments")
@Tag(name = "Comment Management", description = "APIs for managing comments and replies (UC 7.1, 7.2)")
public class CommentController {

    private final ICommentService commentService;

    public CommentController(ICommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Post a new comment or reply", description = "UC 7.1: Adds a new comment to a Post/Question/Answer. Use parentId to make it a reply.")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(@Valid @RequestBody CreateCommentRequest request) {
        CommentResponse createdComment = commentService.addComment(request);
        ApiResponse<CommentResponse> response = new ApiResponse<>(HttpStatus.CREATED, "Comment posted successfully", createdComment, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get comments for an entity (Post, Answer)", description = "Retrieves paginated top-level comments for a given entity.")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getCommentsFor(
            @RequestParam ReactableType type,
            @RequestParam UUID id,
            @ParameterObject @PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.ASC) Pageable pageable) {
        PageResponse<CommentResponse> commentPage = commentService.getCommentsFor(type, id, pageable);
        ApiResponse<PageResponse<CommentResponse>> response = new ApiResponse<>(HttpStatus.OK, "Comments retrieved successfully", commentPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{commentId}/replies")
    @Operation(summary = "Get replies for a comment", description = "Retrieves paginated replies for a specific parent comment.")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getRepliesForComment(
            @PathVariable UUID commentId,
            @ParameterObject @PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.ASC) Pageable pageable) {
        PageResponse<CommentResponse> replyPage = commentService.getRepliesForComment(commentId, pageable);
        ApiResponse<PageResponse<CommentResponse>> response = new ApiResponse<>(HttpStatus.OK, "Replies retrieved successfully", replyPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{commentId}")
    @Operation(summary = "Get a single comment by ID")
    public ResponseEntity<ApiResponse<CommentResponse>> getCommentById(@PathVariable UUID commentId) {
        CommentResponse comment = commentService.getCommentById(commentId);
        ApiResponse<CommentResponse> response = new ApiResponse<>(HttpStatus.OK, "Comment retrieved successfully", comment, null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update an existing comment", description = "UC 7.5: Updates a comment. Requires user to be the author and within edit limit.")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        CommentResponse updatedComment = commentService.updateComment(commentId, request);
        ApiResponse<CommentResponse> response = new ApiResponse<>(HttpStatus.OK, "Comment updated successfully", updatedComment, null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasRole('USER')") // Hoặc 'hasAnyRole("USER", "MODERATOR", "ADMIN")'
    @Operation(summary = "Delete a comment", description = "UC 7.5: Soft-deletes a comment. Requires user to be the author or moderator/admin.")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID commentId) {
        commentService.deleteComment(commentId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Comment deleted successfully", null, null);
        return ResponseEntity.ok(response);
    }
}
