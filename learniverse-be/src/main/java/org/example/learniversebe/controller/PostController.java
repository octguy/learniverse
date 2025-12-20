package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.request.UpdatePostRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.PostResponse;
import org.example.learniversebe.dto.response.PostSummaryResponse;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.service.IPostService;
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
@RequestMapping("/api/v1/posts")
@Tag(name = "Post Management", description = "APIs for managing academic posts (UC 2.2)")
public class PostController {

    private final IPostService postService;

    public PostController(IPostService postService) {
        this.postService = postService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a new post with attachments", description = "Tạo bài viết kèm hình ảnh/PDF (Multipart Form)")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestPart("post")
            @Parameter(
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE
                    )
            )
            @Valid CreatePostRequest request,

            @RequestPart(value = "files", required = false)
            @Parameter(
                    description = "File đính kèm (Image/PDF)",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE)
            )
            List<MultipartFile> files
    ) {
        PostResponse response = postService.createPost(request, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Post created successfully", response, null));
    }

    @PutMapping("/{postId}/publish")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Publish a draft post", description = "Chuyển trạng thái bài viết từ DRAFT sang PUBLISHED")
    public ResponseEntity<ApiResponse<PostResponse>> publishPost(@PathVariable UUID postId) {
        PostResponse response = postService.publishPost(postId);
        return ResponseEntity.ok(
                new ApiResponse<>(HttpStatus.OK, "Post published successfully", response, null)
        );
    }

    @GetMapping("/feed")
    @Operation(summary = "Get the newsfeed posts", description = "UC 2.1: Retrieves a paginated list of all published posts for the newsfeed.")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getNewsfeedPosts(
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostSummaryResponse> postPage = postService.getNewsfeedPosts(pageable);
        ApiResponse<PageResponse<PostSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Newsfeed posts retrieved successfully", postPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}")
    @Operation(summary = "Get a single post by its ID", description = "Retrieves detailed information for a single post.")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable UUID postId) {
        PostResponse post = postService.getPostById(postId);
        ApiResponse<PostResponse> response = new ApiResponse<>(HttpStatus.OK, "Post retrieved successfully", post, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get a single post by its slug", description = "Retrieves detailed information for a single post using its URL-friendly slug.")
    public ResponseEntity<ApiResponse<PostResponse>> getPostBySlug(@PathVariable String slug) {
        PostResponse post = postService.getPostBySlug(slug);
        ApiResponse<PostResponse> response = new ApiResponse<>(HttpStatus.OK, "Post retrieved successfully", post, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get posts by author", description = "Retrieves a paginated list of posts written by a specific author.")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getPostsByAuthor(
            @PathVariable UUID authorId,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostSummaryResponse> postPage = postService.getPostsByAuthor(authorId, pageable);
        ApiResponse<PageResponse<PostSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Posts by author retrieved successfully", postPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tag/{tagId}")
    @Operation(summary = "Get posts by tag", description = "Retrieves a paginated list of posts associated with a specific tag.")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getPostsByTag(
            @PathVariable UUID tagId,
            @ParameterObject @PageableDefault(sort = "publishedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostSummaryResponse> postPage = postService.getPostsByTag(tagId, pageable);
        ApiResponse<PageResponse<PostSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Posts by tag retrieved successfully", postPage, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Search for posts", description = "Performs a full-text search for posts based on a query string.")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> searchPosts(
            @RequestParam String query,
            @ParameterObject Pageable pageable) {
        PageResponse<PostSummaryResponse> postPage = postService.searchPosts(query, pageable);
        ApiResponse<PageResponse<PostSummaryResponse>> response = new ApiResponse<>(HttpStatus.OK, "Post search completed", postPage, null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{postId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update an existing post", description = "UC 2.2: Updates a post. Requires user to be the author and within the 24-hour edit limit.")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request) {
        PostResponse updatedPost = postService.updatePost(postId, request);
        ApiResponse<PostResponse> response = new ApiResponse<>(HttpStatus.OK, "Post updated successfully", updatedPost, null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("hasRole('USER')") // Hoặc 'hasAnyRole("USER", "MODERATOR", "ADMIN")'
    @Operation(summary = "Delete a post", description = "UC 2.2: Soft-deletes a post. Requires user to be the author or moderator/admin.")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable UUID postId) {
        postService.deletePost(postId);
        ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "Post deleted successfully", null, null);
        return ResponseEntity.ok(response);
    }
}
