package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Data required to update a tag")
public class UpdateTagRequest {

    @Schema(description = "New name for the tag", example = "Web Development")
    @Size(max = 100, message = "Tag name cannot exceed 100 characters")
    private String name;

    @Schema(description = "New description for the tag", example = "Topics related to HTML, CSS, JavaScript, React, Spring Boot,...")
    private String description;
}
