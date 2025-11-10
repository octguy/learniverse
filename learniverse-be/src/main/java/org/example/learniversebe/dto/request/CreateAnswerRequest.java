package org.example.learniversebe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Dữ liệu cần thiết để tạo một câu trả lời mới")
public class CreateAnswerRequest {

    @Schema(description = "ID của câu hỏi đang được trả lời", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Question ID cannot be null")
    private UUID questionId;

    @Schema(description = "Nội dung câu trả lời (Markdown/LaTeX)", minLength = 1, maxLength = 5000, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Answer body cannot be blank")
    @Size(min = 1, max = 5000, message = "Answer body must be between 1 and 5000 characters") // Giới hạn theo usecase (~50 words ?)
    private String body;
}
