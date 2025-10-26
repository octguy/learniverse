package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin về Tag (chủ đề)")
public class TagResponse {

    @Schema(description = "ID của tag")
    private UUID id;

    @Schema(description = "Tên của tag")
    private String name;

    @Schema(description = "Slug (dùng cho URL)")
    private String slug;

    @Schema(description = "Mô tả")
    private String description;
}
