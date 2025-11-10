package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.learniversebe.enums.ReactableType;
import org.example.learniversebe.enums.ReactionType;

import java.util.UUID;

@Data
@Schema(description = "Dữ liệu để thêm/xóa reaction")
public class ReactionRequest {

    @Schema(description = "Loại đối tượng được react (CONTENT, ANSWER, COMMENT)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reactable type cannot be null")
    private ReactableType reactableType;

    @Schema(description = "ID của đối tượng được react", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reactable ID cannot be null")
    private UUID reactableId;

    @Schema(description = "Loại reaction theo enum", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Reaction type cannot be null")
    private ReactionType reactionType;
}
