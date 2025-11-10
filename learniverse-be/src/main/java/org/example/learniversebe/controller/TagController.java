package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.CreateTagRequest;
import org.example.learniversebe.model.ApiResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.service.ITagService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@Tag(name = "Tag Management", description = "APIs for managing content tags")
public class TagController {

    private final ITagService tagService;

    public TagController(ITagService tagService) {
        this.tagService = tagService;
    }

    /**
     * Endpoint này trả về danh sách đầy đủ (không phân trang).
     * Dùng khi frontend cần tải tất cả tag một lần (ví dụ: cho dropdown chọn tag).
     */
    @GetMapping("/all")
    @Operation(summary = "Get all tags (non-paginated)", description = "Retrieves a full list of all available tags. Use this for populating selection dropdowns.")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
        List<TagResponse> tags = tagService.getAllTags();
        ApiResponse<List<TagResponse>> response = new ApiResponse<>(HttpStatus.OK, "All tags retrieved successfully", tags, null);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint này hỗ trợ tìm kiếm và phân trang.
     * Dùng khi frontend có chức năng tìm kiếm tag hoặc danh sách tag quá dài.
     */
    @GetMapping
    @Operation(summary = "Search tags (paginated)", description = "Retrieves a paginated list of tags, optionally filtered by a search query.")
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> searchTags(
            @RequestParam(required = false) String query,
            @ParameterObject @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        PageResponse<TagResponse> tagPage = tagService.searchTags(query, pageable);
        ApiResponse<PageResponse<TagResponse>> response = new ApiResponse<>(HttpStatus.OK, "Tags retrieved successfully", tagPage, null);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint tạo tag mới. Yêu cầu quyền Admin hoặc Moderator.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')") // Chỉ Admin/Mod mới được tạo Tag
    @Operation(summary = "Create a new tag", description = "Creates a new tag. Requires ADMIN or MODERATOR role.")
    public ResponseEntity<ApiResponse<TagResponse>> createTag(@Valid @RequestBody CreateTagRequest request) {
        TagResponse createdTag = tagService.createTag(request);
        ApiResponse<TagResponse> response = new ApiResponse<>(HttpStatus.CREATED, "Tag created successfully", createdTag, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}