package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để cập nhật một câu hỏi")
public class UpdateQuestionRequest {

    // Người dùng chỉ có thể sửa trong 24h, logic này sẽ ở Service
    @Schema(description = "Tiêu đề mới", minLength = 10, maxLength = 300, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title cannot be blank for questions")
    @Size(min = 10, max = 300, message = "Title must be between 10 and 300 characters")
    private String title;

    @Schema(description = "Nội dung mới (Markdown/LaTeX)", minLength = 10, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Body cannot be blank")
    @Size(min = 10, message = "Body must be at least 10 characters")
    private String body;

    @Schema(description = "Danh sách ID các tag mới", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "At least one tag is required")
    private Set<UUID> tagIds;

    @Schema(description = "Lý do chỉnh sửa (tùy chọn)")
    private String editReason;
}
