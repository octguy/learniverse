package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Tag with usage count")
public class TopTagResponse {

    @Schema(description = "Tag ID")
    private UUID id;

    @Schema(description = "Tag name")
    private String name;

    @Schema(description = "Tag slug")
    private String slug;

    @Schema(description = "Number of times this tag is used")
    private long usageCount;
}
