package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
@Schema(description = "Dữ liệu cần thiết để cập nhật một câu trả lời")
public class UpdateAnswerRequest {
    @Schema(description = "Nội dung câu trả lời mới (Markdown/LaTeX)", minLength = 1, maxLength = 5000, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Answer body cannot be blank")
    @Size(min = 1, max = 5000, message = "Answer body must be between 1 and 5000 characters")
    private String body;
}
