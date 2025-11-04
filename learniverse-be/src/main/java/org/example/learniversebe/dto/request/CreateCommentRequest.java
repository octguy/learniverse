package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ReactableType;

import java.util.Set;
import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để tạo một bình luận mới")
public class CreateCommentRequest {

    @Schema(description = "Loại đối tượng đang được bình luận (CONTENT hoặc ANSWER)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Commentable type cannot be null")
    private ReactableType commentableType;

    @Schema(description = "ID của đối tượng đang được bình luận", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Commentable ID cannot be null")
    private UUID commentableId;

    @Schema(description = "ID của comment cha (nếu là reply, không bắt buộc)")
    private UUID parentId;

    @Schema(description = "Nội dung bình luận", minLength = 1, maxLength = 5000, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Comment body cannot be blank")
    @Size(min = 1, max = 5000, message = "Comment body must be between 1 and 5000 characters")
    private String body;

    @Schema(description = "Danh sách ID người dùng được mention (tùy chọn)")
    private Set<UUID> mentionedUserIds; // Service sẽ xử lý việc tạo Mention entity
}
