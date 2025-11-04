package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Dữ liệu để bookmark hoặc bỏ bookmark một content")
public class BookmarkRequest {

    @Schema(description = "ID của content (post hoặc question) cần bookmark/bỏ bookmark", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Content ID cannot be null")
    private UUID contentId;

    @Schema(description = "Tên collection", minLength = 1, maxLength = 100)
    private String collectionName;

    @Schema(description = "Ghi chú")
    private String notes;
}
