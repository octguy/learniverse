package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.learniversebe.enums.ContentVisibility;
import org.example.learniversebe.enums.ShareType;

import java.util.UUID;

@Data
public class SharePostRequest {
    @NotNull(message = "Original content ID cannot be null")
    private UUID originalContentId;

    @Size(max = 500, message = "Caption cannot exceed 500 characters")
    private String caption;

    @NotNull(message = "Share type is required (NEWSFEED, GROUP, DIRECT_MESSAGE)")
    private ShareType shareType;

    @Schema(description = "Phạm vi hiển thị bài share (PUBLIC, FRIENDS_ONLY, PRIVATE). Mặc định là PUBLIC")
    private ContentVisibility visibility;
}