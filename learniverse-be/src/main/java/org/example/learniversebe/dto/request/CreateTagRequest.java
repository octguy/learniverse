package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Dữ liệu cần thiết để tạo một Tag (chủ đề) mới")
public class CreateTagRequest {

    @Schema(description = "Tên của tag", example = "Lập trình Web", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Tag name cannot be blank")
    @Size(max = 100, message = "Tag name cannot exceed 100 characters")
    private String name;

    @Schema(description = "Mô tả chi tiết về tag (tùy chọn)", example = "Các chủ đề liên quan đến HTML, CSS, JavaScript, React, Spring Boot,...")
    private String description;
}