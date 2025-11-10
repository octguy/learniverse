package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin về một bookmark của người dùng")
public class BookmarkResponse {

    @Schema(description = "ID của bookmark")
    private UUID id;

    @Schema(description = "ID của người dùng đã bookmark")
    private UUID userId;

    @Schema(description = "Thông tin tóm tắt về nội dung được bookmark")
    private PostSummaryResponse postSummary; // Nếu là Post

    @Schema(description = "Thông tin tóm tắt về nội dung được bookmark")
    private QuestionSummaryResponse questionSummary; // Nếu là Question

    @Schema(description = "Tên collection (nếu có)")
    private String collectionName;

    @Schema(description = "Ghi chú cá nhân (nếu có)")
    private String notes;

    @Schema(description = "Thời gian bookmark")
    private LocalDateTime createdAt;
}