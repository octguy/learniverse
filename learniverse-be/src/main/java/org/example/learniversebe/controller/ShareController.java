package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.SharePostRequest;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.service.IShareService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shares")
@Tag(name = "Share Operations", description = "APIs for sharing content (UC 2.11)")
@PreAuthorize("isAuthenticated()")
public class ShareController {

    private final IShareService shareService;

    public ShareController(IShareService shareService) {
        this.shareService = shareService;
    }

    @PostMapping("/feed")
    @Operation(summary = "Share content to Newsfeed", description = "Creates a new post referencing the original content.")
    public ResponseEntity<ApiResponse<PostResponse>> shareToFeed(@Valid @RequestBody SharePostRequest request) {
        PostResponse response = shareService.shareToFeed(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Content shared to feed successfully", response, null));
    }

    @PostMapping("/track")
    @Operation(summary = "Track share action (Copy link/Direct Message)", description = "Increments share count and logs the action.")
    public ResponseEntity<ApiResponse<Void>> trackShare(@Valid @RequestBody SharePostRequest request) {
        shareService.trackShareAction(request);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Share action tracked successfully", null, null));
    }
}