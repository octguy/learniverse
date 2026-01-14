package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ContentStatus;
import org.example.learniversebe.enums.ContentVisibility;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để tạo một bài post mới")
public class CreatePostRequest {
    @Schema(description = "Tiêu đề bài post (tùy chọn)", maxLength = 300)
    @Size(max = 300, message = "Title cannot exceed 300 characters")
    private String title;

    @Schema(description = "Nội dung bài post (Markdown/LaTeX)", minLength = 10, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Body cannot be blank")
    @Size(min = 10, message = "Body must be at least 10 characters")
    private String body;

    @Schema(description = "Danh sách ID các tag liên quan", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "At least one tag is required")
    private Set<UUID> tagIds;

    @Schema(description = "Trạng thái bài viết (DRAFT hoặc PUBLISHED). Mặc định là PUBLISHED nếu null")
    private ContentStatus status;

    @Schema(description = "Phạm vi hiển thị bài viết (PUBLIC, FRIENDS_ONLY, PRIVATE). Mặc định là PUBLIC. Nếu đăng trong group thì tự động là GROUP")
    private ContentVisibility visibility;

    @Schema(description = "ID nhóm (nếu đăng bài trong nhóm)")
    private UUID groupId;
}

