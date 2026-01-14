package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.ContentVisibility;

@Data
@Schema(description = "Request để cập nhật visibility của bài post")
public class UpdatePostVisibilityRequest {

    @NotNull(message = "Visibility is required")
    @Schema(description = "Phạm vi hiển thị mới", requiredMode = Schema.RequiredMode.REQUIRED)
    private ContentVisibility visibility;
}