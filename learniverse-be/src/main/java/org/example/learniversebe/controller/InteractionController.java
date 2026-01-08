package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.BookmarkRequest;
import org.example.learniversebe.dto.request.ReactionRequest;
import org.example.learniversebe.dto.request.VoteRequest;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.BookmarkResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.service.IInteractionService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interactions")
@Tag(name = "User Interactions", description = "APIs for user interactions (Vote, Reaction, Bookmark, Report - UC 2.3, 3.3, 7.3)")
@PreAuthorize("isAuthenticated()")
public class InteractionController {

    private final IInteractionService interactionService;

    public InteractionController(IInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @PostMapping("/vote")
    @Operation(summary = "Cast a vote (Upvote/Downvote)", description = "UC 3.3: Casts, changes, or removes a vote on a Question or Answer.")
    public ResponseEntity<ApiResponse<Integer>> vote(@Valid @RequestBody VoteRequest request) {
        int newVoteScore = interactionService.vote(request);
        ApiResponse<Integer> response = new ApiResponse<>(HttpStatus.OK, "Vote processed successfully", newVoteScore, null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/react")
    @Operation(summary = "Add/Remove a reaction", description = "UC 2.3: Adds, changes, or removes a reaction on a Post, Question, Answer, or Comment.")
    public ResponseEntity<ApiResponse<Void>> react(@Valid @RequestBody ReactionRequest request) {
        interactionService.react(request);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Reaction processed successfully", null, null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookmark")
    @Operation(summary = "Add bookmark", description = "Ensures the content is bookmarked.")
    public ResponseEntity<ApiResponse<BookmarkResponse>> addBookmark(@Valid @RequestBody BookmarkRequest request) {
        BookmarkResponse response = interactionService.addBookmark(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Bookmarked successfully", response, null));
    }

    @DeleteMapping("/bookmark/{contentId}")
    @Operation(summary = "Remove bookmark", description = "Ensures the content is NOT bookmarked.")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(@PathVariable UUID contentId) {
        interactionService.removeBookmark(contentId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Bookmark removed successfully", null, null));
    }

    @PostMapping("/bookmark/{contentId}/toggle")
    @Operation(summary = "Toggle bookmark", description = "Switches between bookmarked and un-bookmarked.")
    public ResponseEntity<ApiResponse<Boolean>> toggleBookmark(@PathVariable UUID contentId) {
        boolean isBookmarked = interactionService.toggleBookmark(contentId);
        String message = isBookmarked ? "Bookmarked successfully" : "Un-bookmarked successfully";

        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, message, isBookmarked, null));
    }

    @GetMapping("/bookmarks/me")
    @Operation(summary = "Get current user's bookmarks", description = "UC 7.3: Retrieves a paginated list of the current user's bookmarks.")
    public ResponseEntity<ApiResponse<PageResponse<BookmarkResponse>>> getUserBookmarks(
            @RequestParam(required = false) String collection,
            @ParameterObject @PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<BookmarkResponse> bookmarkPage = interactionService.getUserBookmarks(collection, pageable);
        ApiResponse<PageResponse<BookmarkResponse>> response = new ApiResponse<>(HttpStatus.OK, "User bookmarks retrieved successfully", bookmarkPage, null);
        return ResponseEntity.ok(response);
    }

    // TODO: Implement report service
//    @PostMapping("/report")
//    @Operation(summary = "Report an item", description = "UC 2.3: Submits a report for a Post, Question, Answer, or Comment.")
//    public ResponseEntity<ApiResponse<Void>> report(@Valid @RequestBody CreateReportRequest request) {
//        interactionService.report(request);
//        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.CREATED, "Report submitted successfully", null, null);
//        return ResponseEntity.status(HttpStatus.CREATED).body(response);
//    }
}
