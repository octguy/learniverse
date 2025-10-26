package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để cập nhật một bình luận")
public class UpdateCommentRequest {

    @Schema(description = "Nội dung bình luận mới", minLength = 1, maxLength = 5000, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Comment body cannot be blank")
    @Size(min = 1, max = 5000, message = "Comment body must be between 1 and 5000 characters")
    private String body;

    @Schema(description = "Danh sách ID người dùng được mention mới (tùy chọn, có thể ghi đè)")
    private Set<UUID> mentionedUserIds;
}
